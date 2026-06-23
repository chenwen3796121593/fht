export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url)
  const list = searchParams.get('list')
  if (!list) return new Response(JSON.stringify({ error: 'no list' }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })

  try {
    const res = await fetch(`http://hq.sinajs.cn/list=${list}`, {
      headers: { Referer: 'https://finance.sina.com.cn' },
    })
    const buffer = await res.arrayBuffer()
    const text = new TextDecoder('gbk').decode(buffer)
    return new Response(JSON.stringify({ data: text }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
