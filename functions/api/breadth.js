export async function onRequest() {
  try {
    const res = await fetch('https://x-quote.cls.cn/v2/quote/a/stock/emotion', {
      headers: { Referer: 'https://www.cls.cn/', 'User-Agent': 'Mozilla/5.0' },
    })
    const json = await res.json()
    const d = json?.data?.up_down_dis

    if (d) {
      return new Response(JSON.stringify({
        total: d.rise_num + d.fall_num + d.flat_num,
        up: d.rise_num,
        down: d.fall_num,
        limUp: d.up_num,
        limDown: d.down_num,
        updated: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=30' },
      })
    }
    return new Response(JSON.stringify({ total: 0, up: 0, down: 0, limUp: 0, limDown: 0 }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ total: 0, up: 0, down: 0, limUp: 0, limDown: 0 }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
