import https from 'node:https'
import iconv from 'iconv-lite'

const CF = {
  accountId: process.env.CF_ACCOUNT_ID,
  token: process.env.CF_KV_TOKEN,
  namespace: process.env.CF_KV_NAMESPACE || 'd4ecff46f83044c99780cf7837d889c9',
}

// Commodities + indices (always fetch)
const COMMODITY_SYMBOLS = [
  { code: 'sh000001', name: '上证指数', type: 'stock' },
  { code: 'sz399001', name: '深证成指', type: 'stock' },
  { code: 'XAU', name: '现货黄金', type: 'global' },
  { code: 'XAG', name: '现货白银', type: 'global' },
  { code: 'CL', name: '国际原油', type: 'global' },
  { code: 'HG', name: 'COMEX铜', type: 'global' },
  { code: 'AHD', name: 'LME铝', type: 'global' },
  { code: 'M0', name: '豆粕', type: 'inner' },
]

// Fetch all A-share codes from Sina
async function getAStockList() {
  const stocks = []
  for (let page = 1; page <= 50; page++) {
    try {
      const data = await httpsGet(
        `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=100&sort=code&asc=1&node=hs_a`
      )
      if (!Array.isArray(data) || data.length === 0) break
      for (const s of data) {
        const code = s.code || s.symbol
        if (code) {
        // Ensure prefix for CN_MarketData API
        let sc = code
        if (!sc.startsWith('sh') && !sc.startsWith('sz') && !sc.startsWith('bj')) {
          if (sc.startsWith('6')) sc = 'sh' + sc
          else if (sc.startsWith('0') || sc.startsWith('3')) sc = 'sz' + sc
          else if (sc.startsWith('8') || sc.startsWith('4')) sc = 'bj' + sc
        }
        stocks.push({ code: sc, name: s.name || sc, type: 'stock' })
      }
      }
      if (data.length < 100) break
      await sleep(100)
    } catch (e) { break }
  }
  console.log(`  Found ${stocks.length} A-shares`)
  return stocks
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Referer: 'https://finance.sina.com.cn' }, timeout: 10000 }, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try { resolve(JSON.parse(iconv.decode(Buffer.concat(chunks), 'gbk'))) } catch (e) { resolve([]) }
      })
    }).on('error', reject).on('timeout', function() { this.destroy(); resolve([]) })
  })
}

async function kvGet(key) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF.accountId}/storage/kv/namespaces/${CF.namespace}/values/${key}`, {
    headers: { Authorization: `Bearer ${CF.token}` },
  })
  return res.ok ? res.json() : null
}

async function kvPut(key, data) {
  await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF.accountId}/storage/kv/namespaces/${CF.namespace}/values/${key}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${CF.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  console.log(`[${new Date().toISOString()}] K-line update start`)

  // 1. Get all A-share codes
  console.log('Fetching A-share list...')
  const aStocks = await getAStockList()
  const allSymbols = [...COMMODITY_SYMBOLS, ...aStocks]

  console.log(`Total: ${allSymbols.length} symbols to process`)
  let updated = 0, skipped = 0, failed = 0
  const BATCH_SIZE = 5
  const batches = []

  for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
    batches.push(allSymbols.slice(i, i + BATCH_SIZE))
  }

  // 2. Process in batches
  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi]
    console.log(`Batch ${bi + 1}/${batches.length} (${batch.length} symbols)`)

    for (const sym of batch) {
      try {
        let url
        if (sym.type === 'global') {
          url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=${sym.code}`
        } else if (sym.type === 'inner') {
          url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/IndexService.getInnerFuturesDailyKLine?symbol=${sym.code}`
        } else {
          url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${sym.code}&scale=240&ma=5,10,20&datalen=500`
        }

        const key = `kline:${sym.code}`
        const existing = await kvGet(key)
        const oldLen = existing?.length || 0

        // Fetch latest data (only 5 bars for daily update)
        const fetchUrl = sym.type === 'stock'
          ? url.replace('datalen=500', 'datalen=5')
          : url

        const newData = await httpsGet(fetchUrl)
        if (!Array.isArray(newData) || newData.length === 0) { failed++; continue }

        // Merge: existing + new data, deduplicate by date
        if (oldLen > 0) {
          const dateKey = sym.type === 'global' ? 'date' : 'day'
          const existingDates = new Set(existing.map(d => d[dateKey]))
          const newBars = newData.filter(d => !existingDates.has(d[dateKey]))
          if (newBars.length === 0) { skipped++; continue }
          const merged = [...existing, ...newBars].sort((a, b) => (a[dateKey] || '').localeCompare(b[dateKey] || ''))
          await kvPut(key, merged)
          console.log(`  ✅ ${sym.name}: +${newBars.length} new bars (total: ${merged.length})`)
          updated++
        } else {
          // First time: fetch full history
          const fullData = await httpsGet(url)
          if (Array.isArray(fullData) && fullData.length > 0) {
            await kvPut(key, fullData)
            console.log(`  🆕 ${sym.name}: ${fullData.length} bars (first sync)`)
            updated++
          } else { failed++ }
        }
      } catch (e) { failed++ }
    }
    // 100ms between batches
    await sleep(100)
  }

  console.log(`Done. Updated:${updated} Skipped:${skipped} Failed:${failed}`)
  // Re-run next time for failed ones
  if (failed > 0) process.exit(1)
}

main().catch(e => { console.error(e); process.exit(1) })
