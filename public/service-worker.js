const CACHE_NAME = 'fenghuotai-v4'

// SW 直连 push2（不受 CORS 限制），从用户浏览器网络（国内可通）
async function fetchFlowFromPush2() {
  const PARAMS = 'pn=1&pz=40&np=1&fltt=2&invt=2&fid=f62&fs=m:90+t:2&fields=f2,f3,f12,f14,f62,f184'

  async function tryFetch(protocol) {
    const base = `${protocol}://push2.eastmoney.com/api/qt/clist/get`
    const [inRes, outRes] = await Promise.all([
      fetch(`${base}?${PARAMS}&po=1`),
      fetch(`${base}?${PARAMS}&po=0`),
    ])
    if (!inRes.ok || !outRes.ok) throw new Error(`HTTP ${inRes.status}/${outRes.status}`)
    return [await inRes.json(), await outRes.json()]
  }

  let inJson, outJson
  try {
    [inJson, outJson] = await tryFetch('https')  // HTTPS 优先（避免混合内容问题）
    console.log('[SW] push2 HTTPS OK')
  } catch (e) {
    console.warn('[SW] push2 HTTPS failed:', e.message, 'trying HTTP...')
    try {
      [inJson, outJson] = await tryFetch('http')
      console.log('[SW] push2 HTTP OK')
    } catch (e2) {
      console.error('[SW] push2 both failed — HTTP:', e.message, 'HTTPS:', e2.message)
      return new Response(JSON.stringify({ data: [], outData: [] }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  const mapItems = (arr) => {
    const items = arr?.data?.diff || []
    return items.map(i => ({
      name: i.f14 || '?', code: i.f12 || '',
      change: parseFloat(i.f3) || 0, netFlow: parseFloat(i.f62) || 0, netRatio: parseFloat(i.f184) || 0,
    }))
  }

  const data = mapItems(inJson).filter(i => i.netFlow > 0).slice(0, 10)
  const outData = mapItems(outJson).filter(i => i.netFlow < 0).slice(0, 10)
  console.log('[SW] flow data ready — in:', data.length, 'out:', outData.length)

  return new Response(JSON.stringify({ data, outData }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// SW 直连 push2his 获取昨日两市成交额
async function fetchYesterdayTurnover() {
  const FIELDS = 'fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57'
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  try {
    const [shRes, szRes] = await Promise.all([
      fetch(`https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.000001&klt=101&fqt=0&beg=20250101&end=${today}&lmt=3&${FIELDS}`),
      fetch(`https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=0.399001&klt=101&fqt=0&beg=20250101&end=${today}&lmt=3&${FIELDS}`),
    ])
    const shJson = await shRes.json()
    const szJson = await szRes.json()
    const shLines = shJson?.data?.klines || []
    const szLines = szJson?.data?.klines || []
    if (shLines.length < 2 || szLines.length < 2) throw new Error('no yesterday data')

    const parse = (k) => { const p = k.split(','); return { date: p[0], turnover: parseFloat(p[6]) || 0 } }
    const sh = parse(shLines[shLines.length - 2])
    const sz = parse(szLines[szLines.length - 2])

    return new Response(JSON.stringify({
      date: sh.date,
      shTurnover: sh.turnover,
      szTurnover: sz.turnover,
      total: sh.turnover + sz.turnover,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ total: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // SW 直连 push2 获取板块资金数据（绕过 CF 网络限制）
  if (url.pathname === '/api/flow') {
    event.respondWith(fetchFlowFromPush2())
    return
  }

  // SW 直连 push2his 获取昨日成交额
  if (url.pathname === '/api/yesterday-turnover') {
    event.respondWith(fetchYesterdayTurnover())
    return
  }

  // Never cache API calls — Supabase, /api/* etc
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    return // let browser handle normally, no caching
  }

  // Network-first for HTML
  if (request.destination === 'document' || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Cache-first for hashed assets only
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      const clone = res.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
      return res
    }))
  )
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  self.registration.showNotification(data.title || '烽火台', {
    body: data.message || '',
    icon: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'price-alert',
  })
})
