// 预测大模型数据代理 — GitHub 地址存于环境变量，源码不泄露
export async function onRequest({ request, env }) {
  const GH_BASE = env.GH_DATA_URL
  if (!GH_BASE) {
    return new Response(JSON.stringify({ error: 'not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
  const url = new URL(request.url)
  const file = url.searchParams.get('file')
  if (!file || !/^[a-z0-9_.-]+\.json$/.test(file)) {
    return new Response(JSON.stringify({ error: 'invalid' }), {
      status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
  try {
    const res = await fetch(`${GH_BASE}/${file}`)
    const data = await res.text()
    return new Response(data, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
