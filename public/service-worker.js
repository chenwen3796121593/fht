const CACHE_NAME = 'fenghuotai-v2'

// On install, cache nothing - fetch on demand
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Clean old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first for HTML, cache-first for assets with hashed names
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Always go network-first for HTML (picks up new deployments)
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

  // Cache-first for hashed assets (JS/CSS with unique names per build)
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      const clone = res.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
      return res
    }))
  )
})

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  self.registration.showNotification(data.title || '烽火台', {
    body: data.message || '',
    icon: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'price-alert',
  })
})
