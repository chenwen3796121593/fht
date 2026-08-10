const CACHE_NAME = 'fenghuotai-v6'

// 仅放行这两个东财域名。历史事故域名一律不放行：
//  - push2.eastmoney.com      → CF 边缘 502 + 客户端封 IP
//  - hq.sinajs.cn             → 无 CORS
//  - push2his.eastmoney.com   → 响应体空
const ALLOWED_HOSTS = ['push2delay.eastmoney.com', 'push2ex.eastmoney.com']

self.addEventListener('install', () => self.skipWaiting())

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

  // 前端客户端直连东财，经 SW 代理（白名单放行）
  if (ALLOWED_HOSTS.includes(url.hostname)) {
    event.respondWith(fetch(event.request))
    return
  }

  // 不拦截 API 与 supabase，交给浏览器 / CF 默认处理
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) return

  // HTML：network-first
  if (request.destination === 'document' || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // 静态资源：cache-first
  event.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request).then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((c) => c.put(request, clone))
        return res
      })
    )
  )
})
