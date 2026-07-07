// 预测大模型数据代理 — GitHub 地址存于环境变量
export async function onRequest({ request, env }) {
  const url = new URL(request.url)
  const file = url.searchParams.get('file')
  const raw = url.searchParams.get('raw') // 可选的完整 URL（用于其他仓库）

  let target
  if (raw) {
    // 只允许 raw.githubusercontent.com 的链接
    if (!raw.startsWith('https://raw.githubusercontent.com/')) {
      return new Response(JSON.stringify({ error: 'invalid raw url' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }
    // CF 封 raw.githubusercontent.com，走 Deno 代理
    target = `https://naive-toad-3432.chenheping1974.deno.net/?url=${encodeURIComponent(raw+'?t='+Date.now())}`
  } else {
    const GH_BASE = env.GH_DATA_URL
    if (!GH_BASE) {
      return new Response(JSON.stringify({ error: 'not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }
    if (!file || !/^[a-z0-9_.-]+\.json$/.test(file)) {
      return new Response(JSON.stringify({ error: 'invalid' }), {
        status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
    target = `${GH_BASE}/${file}`
  }

  try {
    const res = await fetch(target)
    const data = await res.text()
    const cleaned = data.replace(/: NaN/g, ': null').replace(/: Infinity/g, ': null').replace(/: -Infinity/g, ': null')
    const cacheTime = raw ? 300 : 3600 // raw 数据 5 分钟，静态数据 1 小时
    return new Response(cleaned, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': `public, max-age=${cacheTime}` },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
