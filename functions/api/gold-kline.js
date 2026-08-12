import { getGoldKlines } from '../lib/goldData.js'

export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url)
  const period = searchParams.get('period') || 'd'

  const data = await getGoldKlines(period)
  if (!data || !data.length) return r([])

  const kv = context.env.KLINE_CACHE
  if (kv) { try { context.waitUntil(kv.put('goldkline:' + period, JSON.stringify(data), { expirationTtl: 300 })) } catch (e) {} }
  return r(data)
}

function r(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
