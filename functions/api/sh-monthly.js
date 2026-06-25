export async function onRequest() {
  try {
    const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=sh000001&scale=240&ma=no&datalen=6000`
    const res = await fetch(url, { headers: { Referer: 'https://finance.sina.com.cn' } })
    const txt = await res.text()
    const daily = JSON.parse(txt)
    if (!Array.isArray(daily)) return r([])

    // Aggregate daily K-line → monthly (last trading day close per month)
    const monthly = {}
    daily.forEach(d => {
      if (!d.day) return
      const m = String(d.day).slice(0, 7)
      monthly[m] = parseFloat(d.close)
    })
    const result = Object.entries(monthly)
      .map(([date, close]) => ({ date, close }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return r(result)
  } catch (e) {
    return r([])
  }
}

function r(d) {
  return new Response(JSON.stringify(d), {
    headers: { 'Content-Type':'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'public, max-age=86400' },
  })
}
