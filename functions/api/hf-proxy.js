// HF Space 地址代理 — 实际 URL 存于环境变量
export async function onRequest({ request, env }) {
  const url = new URL(request.url)
  const site = url.searchParams.get('site')
  let target
  if (site === 'timesfm') target = env.HF_TIMESFM_MOIRAI
  else if (site === 'chronos') target = env.HF_CHRONOS_KRONOS
  if (!target) {
    return new Response(JSON.stringify({ error: 'invalid' }), {
      status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
  return new Response(JSON.stringify({ url: target }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
  })
}
