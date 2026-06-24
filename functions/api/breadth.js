// Cache in global scope (persists between invocations at the edge)
let cached = null
let cacheTime = 0
const TTL = 30000 // 30 seconds

export async function onRequest() {
  const now = Date.now()
  if (cached && now - cacheTime < TTL) {
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    let up = 0, down = 0, limUp = 0, limDown = 0
    // Fetch 20 pages (2000 stocks) - enough for representative sample
    for (let page = 1; page <= 50; page++) {
      const url = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=100&sort=changepercent&asc=0&node=hs_a`
      const res = await fetch(url, { headers: { Referer: 'https://finance.sina.com.cn' } })
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        if (!data || data.length === 0) break
        for (const s of data) {
          const chg = parseFloat(s.changepercent) || 0
          if (chg > 0) up++
          else if (chg < 0) down++
          if (chg >= 9.9) limUp++
          if (chg <= -9.9) limDown++
        }
        if (data.length < 100) break
      } catch (e) { break }
    }

    cached = { total: up + down, up, down, limUp, limDown }
    cacheTime = now
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(JSON.stringify(cached || { total: 0, up: 0, down: 0, limUp: 0, limDown: 0 }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
