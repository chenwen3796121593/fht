// 密码校验 — SHA-256 哈希比对，前端不存哈希
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const { hash } = await request.json()
    const valid = env.AI_ANALYSIS_PASS
    if (valid && hash === valid) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ ok: false }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }
}
