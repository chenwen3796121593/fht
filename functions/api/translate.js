// 翻译接口 — DeepSeek API
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response('POST only', { status: 405 })
  try {
    const { text } = await request.json()
    if (!text?.trim()) return new Response(JSON.stringify({ result: '' }), { headers: { 'Content-Type': 'application/json' } })
    const key = env.DEEPSEEK_API_KEY
    if (!key) return new Response(JSON.stringify({ result: text }), { headers: { 'Content-Type': 'application/json' } })

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个专业翻译。将用户输入的英文翻译成简洁流畅的中文，只返回翻译结果，不要任何解释。' },
          { role: 'user', content: text },
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    })
    const json = await res.json()
    const result = json?.choices?.[0]?.message?.content || text
    return new Response(JSON.stringify({ result }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ result: '' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
