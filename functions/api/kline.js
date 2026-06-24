const TTL_DAYS = 86400 // 24h cache

export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url)
  const symbol = searchParams.get('symbol')
  if (!symbol) return new Response('[]', { headers: cH() })

  const kv = context.env.KLINE_CACHE
  const cacheKey = `kline:${symbol}`
  const now = Date.now()

  try {
    // Check KV cache
    if (kv) {
      const cached = await kv.get(cacheKey, 'json')
      if (cached && cached.ts && (now - cached.ts < TTL_DAYS * 1000)) {
        // Merge: return cached data (all historical bars)
        return new Response(JSON.stringify(cached.data), { headers: cH() })
      }
    }

    // Fetch from Sina
    const cMap = { hf_XAU: 'XAU', hf_XAG: 'XAG', hf_CL: 'CL', hf_HG: 'HG', hf_AHD: 'AHD' }
    const commCode = cMap[symbol]
    let url
    if (commCode) {
      url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=${commCode}`
    } else if (symbol.startsWith('nf_')) {
      url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/IndexService.getInnerFuturesDailyKLine?symbol=${symbol.replace('nf_', '')}`
    } else {
      url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=240&ma=5,10,20&datalen=500`
    }

    const res = await fetch(url, { headers: { Referer: 'https://finance.sina.com.cn' } })
    const buffer = await res.arrayBuffer()
    const text = new TextDecoder('gbk').decode(buffer)
    const data = JSON.parse(text || '[]')

    // Cache in KV (24h)
    if (kv && Array.isArray(data) && data.length > 0) {
      context.waitUntil(kv.put(cacheKey, JSON.stringify({ ts: now, data })))
    }

    // Return trimmed to latest 90 bars for performance
    const result = Array.isArray(data) ? data.slice(-90) : []
    return new Response(JSON.stringify(result), { headers: cH() })
  } catch (e) {
    return new Response('[]', { headers: cH() })
  }
}

function cH() {
  return { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' }
}
