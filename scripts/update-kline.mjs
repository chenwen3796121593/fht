import https from 'node:https'
import iconv from 'iconv-lite'

const CF = {
  accountId: process.env.CF_ACCOUNT_ID,
  token: process.env.CF_KV_TOKEN,
  namespace: process.env.CF_KV_NAMESPACE || 'd4ecff46f83044c99780cf7837d889c9',
}

const SYMBOLS = [
  { code: 'sh000001', name: '上证指数', type: 'stock' },
  { code: 'sz399001', name: '深证成指', type: 'stock' },
  { code: 'XAU', name: '现货黄金', type: 'global' },
  { code: 'XAG', name: '现货白银', type: 'global' },
  { code: 'CL', name: '国际原油', type: 'global' },
  { code: 'HG', name: 'COMEX铜', type: 'global' },
  { code: 'AHD', name: 'LME铝', type: 'global' },
  { code: 'M0', name: '豆粕', type: 'inner' },
]

function httpsGet(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { Referer: 'https://finance.sina.com.cn' }, timeout: 15000 }, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try { resolve(JSON.parse(iconv.decode(Buffer.concat(chunks), 'gbk'))) } catch (e) { resolve([]) }
      })
    }).on('error', () => resolve([])).on('timeout', function() { this.destroy(); resolve([]) })
  })
}

async function kvGet(key) {
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF.accountId}/storage/kv/namespaces/${CF.namespace}/values/${key}`, {
      headers: { Authorization: `Bearer ${CF.token}` },
    })
    return res.ok ? res.json() : null
  } catch (e) { return null }
}

async function kvPut(key, data) {
  await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF.accountId}/storage/kv/namespaces/${CF.namespace}/values/${key}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${CF.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

async function main() {
  console.log(`[${new Date().toISOString()}] Daily K-line update`)
  let updated = 0, skipped = 0

  for (const sym of SYMBOLS) {
    try {
      const key = `kline:${sym.code}`
      const existing = await kvGet(key)
      const oldLen = existing?.length || 0

      // Fetch latest 5 bars
      let url
      if (sym.type === 'global') {
        url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=${sym.code}`
      } else if (sym.type === 'inner') {
        url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/IndexService.getInnerFuturesDailyKLine?symbol=${sym.code}`
      } else {
        url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${sym.code}&scale=240&ma=5,10,20&datalen=5`
      }

      const newData = await httpsGet(url)
      if (!Array.isArray(newData) || newData.length === 0) { console.log(`  ❌ ${sym.name}: no data`); continue }

      if (oldLen > 0) {
        const dateKey = sym.type === 'global' ? 'date' : 'day'
        const existingDates = new Set(existing.map(d => d[dateKey]))
        const newBars = newData.filter(d => !existingDates.has(d[dateKey]))
        if (newBars.length === 0) { skipped++; console.log(`  ✅ ${sym.name}: unchanged`); continue }
        const merged = [...existing, ...newBars].sort((a, b) => (a[dateKey] || '').localeCompare(b[dateKey] || ''))
        await kvPut(key, merged)
        console.log(`  📈 ${sym.name}: +${newBars.length} → ${merged.length} bars`)
        updated++
      } else {
        // First sync: fetch full history
        const fullUrl = url.replace('datalen=5', 'datalen=500')
        const fullData = await httpsGet(fullUrl)
        if (Array.isArray(fullData)) {
          await kvPut(key, fullData)
          console.log(`  🆕 ${sym.name}: ${fullData.length} bars`)
          updated++
        }
      }
      await new Promise(r => setTimeout(r, 200))
    } catch (e) { console.log(`  ❌ ${sym.name}: ${e.message}`) }
  }

  console.log(`Done. Updated:${updated} Skipped:${skipped}`)

  // Calculate market breadth
  console.log('Calculating market breadth...')
  try {
    const seen = new Set()
    let up = 0, down = 0, limUp = 0, limDown = 0
    for (let page = 1; page <= 60; page++) {
      const data = await httpsGet(`https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=100&sort=changepercent&asc=0&node=hs_a`)
      if (!Array.isArray(data) || data.length === 0) break
      for (const s of data) {
        seen.add(s.code || s.symbol)
        const chg = parseFloat(s.changepercent) || 0
        if (chg > 0) up++; else if (chg < 0) down++
        if (chg >= 9.8) limUp++
      }
      if (data.length < 100) break
    }
    for (let page = 1; page <= 10; page++) {
      const data = await httpsGet(`https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=100&sort=changepercent&asc=1&node=hs_a`)
      if (!Array.isArray(data) || data.length === 0) break
      for (const s of data) {
        const chg = parseFloat(s.changepercent) || 0
        if (chg <= -9.8) limDown++
      }
      if (data.length < 100) break
    }
    const breadth = { total: seen.size, up, down, limUp, limDown }
    console.log(`  Breadth: ${JSON.stringify(breadth)}`)
    await kvPut('breadth:latest', breadth)
  } catch(e) { console.log(`  Breadth error: ${e.message}`) }
}

main()
