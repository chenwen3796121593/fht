// 返回昨日+前日两市成交额（push2his K线数据，单位：元）
const KLINE_URL = 'https://push2his.eastmoney.com/api/qt/stock/kline/get'
const FIELDS = 'fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57'

async function getKlines(secid) {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const res = await fetch(`${KLINE_URL}?secid=${secid}&klt=101&fqt=0&beg=20250601&end=${today}&lmt=4&${FIELDS}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://data.eastmoney.com/' },
    })
    const json = await res.json()
    return json?.data?.klines || []
  } catch { return [] }
}

function parseTurnover(kline) {
  const parts = kline.split(',')
  return { date: parts[0], turnover: parseFloat(parts[6]) || 0 }
}

export async function onRequest() {
  try {
    const [shLines, szLines] = await Promise.all([
      getKlines('1.000001'),
      getKlines('0.399001'),
    ])

    if (shLines.length < 3 || szLines.length < 3) {
      return new Response(JSON.stringify({ total: 0, prevTotal: 0 }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    // K线升序：[-3]=前日 [-2]=昨日 [-1]=今天
    const shYest = parseTurnover(shLines[shLines.length - 2])
    const szYest = parseTurnover(szLines[szLines.length - 2])
    const shPrev = parseTurnover(shLines[shLines.length - 3])
    const szPrev = parseTurnover(szLines[szLines.length - 3])

    return new Response(JSON.stringify({
      date: shYest.date,
      total: shYest.turnover + szYest.turnover,
      prevDate: shPrev.date,
      prevTotal: shPrev.turnover + szPrev.turnover,
    }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
    })
  } catch {
    return new Response(JSON.stringify({ total: 0, prevTotal: 0 }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
