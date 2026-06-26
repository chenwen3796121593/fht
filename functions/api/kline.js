export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url)
  const symbol = searchParams.get('symbol')
  const all = searchParams.get('all') === '1'
  const isIntraday = searchParams.get('intraday') === '1'
  const scale = searchParams.get('scale') || '240'
  if (!symbol) return r([])

  const kv = context.env.KLINE_CACHE
  const cacheKey = `kline:${symbol}`
  const cMap = { hf_XAU: 'XAU', hf_XAG: 'XAG', hf_CL: 'CL', hf_HG: 'HG', hf_AHD: 'AHD' }
  const commCode = cMap[symbol]
  const isGlobal = !!commCode, isInner = symbol.startsWith('nf_')
  // ── Intraday: Chinese stocks via Sina ──
  if (isIntraday) {
    let url
    if (isInner) {
      url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/IndexService.getInnerFuturesMinuteKLine?symbol=${symbol.replace('nf_','')}&type=5`
    } else {
      url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=${scale}&ma=no&datalen=240`
    }
    try {
      const res = await fetch(url, { headers: { Referer: 'https://finance.sina.com.cn' } })
      const buffer = await res.arrayBuffer()
      const text = new TextDecoder('gbk').decode(buffer)
      return r(JSON.parse(text || '[]') || [])
    } catch (e) { return r([]) }
  }

  // ── Daily / All ──
  try {
    if (kv) {
      const cached = await kv.get(cacheKey, 'json')
      if (cached && Array.isArray(cached) && cached.length > 0) {
        const last = cached[cached.length - 1]
        const lastDate = last?.date || last?.day || ''
        const today = new Date().toISOString().split('T')[0]
        if (lastDate === today) return r(all ? cached : cached.slice(-90))
      }
    }

    let url
    if (isGlobal) {
      url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=${commCode}`
    } else if (isInner) {
      url = `https://stock2.finance.sina.com.cn/futures/api/json_v2.php/IndexService.getInnerFuturesDailyKLine?symbol=${symbol.replace('nf_','')}`
    } else {
      url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=240&ma=5,10,20&datalen=500`
    }

    const res = await fetch(url, { headers: { Referer: 'https://finance.sina.com.cn' } })
    const buffer = await res.arrayBuffer()
    const text = new TextDecoder('gbk').decode(buffer)
    const fresh = JSON.parse(text || '[]')

    if (!Array.isArray(fresh) || fresh.length === 0) {
      const cached = kv ? await kv.get(cacheKey, 'json') : null
      return r(cached ? (all ? cached : cached.slice(-90)) : [])
    }

    if (kv) {
      const existing = await kv.get(cacheKey, 'json')
      if (existing && Array.isArray(existing)) {
        const dateKey = isGlobal || isInner ? 'date' : 'day'
        const existingDates = new Set(existing.map(d => d[dateKey]))
        const newBars = fresh.filter(d => !existingDates.has(d[dateKey]))
        if (newBars.length > 0) {
          const merged = [...existing, ...newBars].sort((a,b) => (a[dateKey]||'').localeCompare(b[dateKey]||''))
          context.waitUntil(kv.put(cacheKey, JSON.stringify(merged)))
        }
      } else {
        context.waitUntil(kv.put(cacheKey, JSON.stringify(fresh)))
      }
    }

    return r(all ? fresh : fresh.slice(-90))
  } catch (e) { return r([]) }
}

function r(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  })
}
