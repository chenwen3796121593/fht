// 预测大模型数据代理 — 全部 CF 直连
export async function onRequest({ request, env }) {
  const url = new URL(request.url)
  const file = url.searchParams.get('file')
  const raw = url.searchParams.get('raw')

  let target
  if (raw) {
    if (!raw.startsWith('https://raw.githubusercontent.com/')) {
      return new Response(JSON.stringify({ error: 'invalid' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    target = raw
  } else if (file) {
    const base = env.GH_DATA_URL
    if (!base) return new Response(JSON.stringify({ error: 'not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    target = `${base}/${file}`
  } else {
    return new Response(JSON.stringify({ error: 'missing param' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await fetch(target)
    const data = await res.text()
    const cleaned = data.replace(/: NaN/g, ': null').replace(/: Infinity/g, ': null').replace(/: -Infinity/g, ': null')
    // 缓存到今天23:59:59过期，每天零点自动刷新
    const now = new Date()
    const midnight = new Date(now); midnight.setHours(24,0,0,0)
    const cacheTime = Math.floor((midnight - now) / 1000)
    return new Response(cleaned, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': `public, max-age=${cacheTime}` },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
}
