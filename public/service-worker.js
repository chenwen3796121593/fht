const CACHE_NAME = 'fenghuotai-v3'

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
