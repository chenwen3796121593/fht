// 板块资金流向 — Service Worker 直连 push2（手机端已生效）
export async function onRequest() {
  return new Response(JSON.stringify({ data: [], outData: [] }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=30' },
  })
}
