import https from 'https'
import iconv from 'iconv-lite'

const CF = {
  accountId: process.env.CF_ACCOUNT_ID,
  token: process.env.CF_KV_TOKEN,
  namespace: process.env.CF_KV_NAMESPACE || 'd4ecff46f83044c99780cf7837d889c9',
}

// Symbol list — expand this to add more
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

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Referer: 'https://finance.sina.com.cn' } }, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const buf = Buffer.concat(chunks)
        const text = iconv.decode(buf, 'gbk')
        try { resolve(JSON.parse(text)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
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

async function main() {
  console.log(`[${new Date().toISOString()}] Starting K-line update for ${SYMBOLS.length} symbols...`)
  let updated = 0

  for (const sym of SYMBOLS) {
    try {
      let url
      if (sym.type === 'global') {
        url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=${sym.code}`
      } else if (sym.type === 'inner') {
        url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/IndexService.getInnerFuturesDailyKLine?symbol=${sym.code}`
      } else {
        url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${sym.code}&scale=240&ma=5,10,20&datalen=500`
      }

      const data = await fetch(url)
      if (Array.isArray(data) && data.length > 0) {
        const key = `kline:${sym.code}`

        // Only update if data changed
        const existing = await kvGet(key)
        const newLen = data.length
        const oldLen = existing?.length || 0

        if (newLen > oldLen) {
          await kvPut(key, data)
          console.log(`  ✅ ${sym.name} (${sym.code}): ${oldLen}→${newLen} bars updated`)
          updated++
        } else {
          console.log(`  ⏭️  ${sym.name} (${sym.code}): ${newLen} bars unchanged`)
        }
      } else {
        console.log(`  ❌ ${sym.name} (${sym.code}): no data`)
      }

      // Rate limit: 200ms between requests
      await new Promise(r => setTimeout(r, 200))
    } catch (e) {
      console.log(`  ❌ ${sym.name} (${sym.code}): ${e.message}`)
    }
  }

  console.log(`Done. Updated ${updated}/${SYMBOLS.length} symbols.`)
}

main().catch(console.error)
