export async function onRequest(context) {
  try {
    const kv = context.env.KLINE_CACHE
    if (kv) {
      const cached = await kv.get('breadth:latest', 'json')
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' },
        })
      }
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
