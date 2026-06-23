export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url)
  const lid = searchParams.get('lid') || '2509'

  try {
    const res = await fetch(
      `https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=${lid}&k=&num=30`,
      { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://finance.sina.com.cn' } }
    )
    const json = await res.json()
    return new Response(JSON.stringify(json), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
