export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url)
  const q = searchParams.get('q')
  if (!q) return r({ code: '', name: '' })

  try {
    const sinaUrl = `https://suggest3.sinajs.cn/suggest/type=11&key=${encodeURIComponent(q)}`
    const res = await fetch(sinaUrl, {
      headers: { Referer: 'https://finance.sina.com.cn' },
    })
    const text = await res.text()
    const match = text.match(/(?:sz|sh|bj)\d{6}/)
    const code = match ? match[0] : ''
    return r({ code, name: q })
  } catch (e) {
    return r({ code: '', name: q })
  }
}

function r(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' },
  })
}
