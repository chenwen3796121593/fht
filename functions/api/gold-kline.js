// 伦敦黄金（XAU，美元/盎司）K 线
// 数据源：
//  - 日/周/月：新浪全球期货 XAU 日线（国内手机可达、CF 出口可达、真实伦敦金）→ 周/月由日线聚合
//  - 小时/4小时：Kraken XAUTUSD 分钟线（经 Cloudflare 函数代理拉取，CF 出口可达；手机经 CF 域名访问即可）
//  说明：国内公开免费源无分钟级伦敦金数据，故 1h/4h 走 Kraken（海外源，但经 CF 代理不直连）。
const SINA_DAILY = 'https://stock2.finance.sina.com.cn/futures/api/json_v2.php/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=XAU'
const KRAKEN_INT = { '1h': '60', '4h': '240' }

function toNum(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : 0 }

async function sinaDaily() {
  const res = await fetch(SINA_DAILY, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const arr = await res.json().catch(() => null)
  if (!Array.isArray(arr) || !arr.length) return null
  return arr
    .map((b) => ({
      day: new Date(b.date + 'T00:00:00Z').toISOString(),
      open: toNum(b.open), high: toNum(b.high), low: toNum(b.low), close: toNum(b.close), volume: toNum(b.volume),
    }))
    .filter((b) => b.open && b.close)
}

async function kraken(period) {
  const interval = KRAKEN_INT[period]
  const url = `https://api.kraken.com/0/public/OHLC?pair=XAUTUSD&interval=${interval}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const j = await res.json().catch(() => null)
  const rows = j && j.result && j.result.XAUTUSD
  if (!Array.isArray(rows) || !rows.length) return null
  return rows
    .map((r) => ({
      day: new Date(r[0] * 1000).toISOString(),
      open: toNum(r[1]), high: toNum(r[2]), low: toNum(r[3]), close: toNum(r[4]), volume: toNum(r[6]),
    }))
    .filter((b) => b.open && b.close)
}

function toMonthly(daily) {
  const map = {}
  for (const b of daily) {
    const ym = b.day.slice(0, 7)
    if (!map[ym]) map[ym] = { open: b.open, high: b.high, low: b.low, close: b.close, day: b.day }
    else {
      map[ym].high = Math.max(map[ym].high, b.high)
      map[ym].low = Math.min(map[ym].low, b.low)
      map[ym].close = b.close
      map[ym].day = b.day
    }
  }
  return Object.values(map)
}

function toWeekly(daily) {
  const map = {}
  for (const b of daily) {
    const dt = new Date(b.day)
    const oneJan = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1))
    const wk = Math.ceil((((dt - oneJan) / 86400000) + ((oneJan.getUTCDay() + 1) % 7)) / 7)
    const key = dt.getUTCFullYear() + '-' + wk
    if (!map[key]) map[key] = { open: b.open, high: b.high, low: b.low, close: b.close, day: b.day }
    else {
      map[key].high = Math.max(map[key].high, b.high)
      map[key].low = Math.min(map[key].low, b.low)
      map[key].close = b.close
      map[key].day = b.day
    }
  }
  return Object.values(map)
}

export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url)
  const period = searchParams.get('period') || 'd'

  let data = null
  if (period === '1h' || period === '4h') {
    data = await kraken(period)
  } else if (period === 'm') {
    const d = await sinaDaily(); data = d ? toMonthly(d) : null
  } else if (period === 'w') {
    const d = await sinaDaily(); data = d ? toWeekly(d) : null
  } else {
    data = await sinaDaily()
  }

  if (!data || !data.length) return r([])

  const kv = context.env.KLINE_CACHE
  if (kv) { try { context.waitUntil(kv.put('goldkline:' + period, JSON.stringify(data), { expirationTtl: 300 })) } catch (e) {} }
  return r(data)
}

function r(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
