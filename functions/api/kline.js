export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url)
  const symbol = searchParams.get('symbol')
  if (!symbol) return r([])

  const kv = context.env.KLINE_CACHE
  const cacheKey = `kline:${symbol}`

  try {
    // Try KV cache
    if (kv) {
      const cached = await kv.get(cacheKey, 'json')
      if (cached && Array.isArray(cached) && cached.length > 0) {
        const last = cached[cached.length - 1]
        const lastDate = last?.date || last?.day || ''
        const today = new Date().toISOString().split('T')[0]
        // If cached data is from today, return instantly
        if (lastDate === today) {
          return r(cached.slice(-90))
        }
        // Otherwise, fetch latest and merge below
      }
    }

    // Fetch from Sina
    const cMap = { hf_XAU: 'XAU', hf_XAG: 'XAG', hf_CL: 'CL', hf_HG: 'HG', hf_AHD: 'AHD' }
    const commCode = cMap[symbol]
    const isGlobal = !!commCode
    const isInner = symbol.startsWith('nf_')

    let url
    if (isGlobal) {
      url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=${commCode}`
    } else if (isInner) {
      url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/IndexService.getInnerFuturesDailyKLine?symbol=${symbol.replace('nf_', '')}`
    } else {
      url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=240&ma=5,10,20&datalen=500`
    }

    const res = await fetch(url, { headers: { Referer: 'https://finance.sina.com.cn' } })
    const buffer = await res.arrayBuffer()
    const text = new TextDecoder('gbk').decode(buffer)
    const fresh = JSON.parse(text || '[]')

    if (!Array.isArray(fresh) || fresh.length === 0) {
      // Return cached if fetch fails
      const cached = kv ? await kv.get(cacheKey, 'json') : null
      return r(cached ? cached.slice(-90) : [])
    }

    // Merge with existing KV data
    if (kv) {
      const existing = await kv.get(cacheKey, 'json')
      if (existing && Array.isArray(existing)) {
        const dateKey = isGlobal || isInner ? 'date' : 'day'
        const existingDates = new Set(existing.map(d => d[dateKey]))
        const newBars = fresh.filter(d => !existingDates.has(d[dateKey]))
        if (newBars.length > 0) {
          const merged = [...existing, ...newBars].sort((a, b) => (a[dateKey] || '').localeCompare(b[dateKey] || ''))
          context.waitUntil(kv.put(cacheKey, JSON.stringify(merged)))
        } else {
          // Refresh KV with fresh data anyway (e.g. after weekend)
          context.waitUntil(kv.put(cacheKey, JSON.stringify(fresh)))
        }
      } else {
        // First time: store full data
        context.waitUntil(kv.put(cacheKey, JSON.stringify(fresh)))
      }
    }

    return r(fresh.slice(-90))
  } catch (e) {
    return r([])
  }
}

function r(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  })
}
