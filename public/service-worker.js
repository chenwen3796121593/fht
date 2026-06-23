const CACHE_NAME = 'fenghuotai-v1'
const ASSETS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  )
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
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
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
