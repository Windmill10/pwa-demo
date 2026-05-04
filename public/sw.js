const CACHE_NAME = 'pwa-demo-v2'

self.addEventListener('install', (event) => {
  // Don't pre-cache HTML -- always fetch it from network
  // Only pre-cache truly static assets that never change
  event.waitUntil(
    caches.open(CACHE_NAME).then(() => self.skipWaiting())
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('activate', (event) => {
  // Delete ALL old caches to break stale data from previous deploys
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Navigation requests (HTML pages): network-first
  // This is the critical fix -- always fetch the latest HTML from the server
  // so stale service workers don't serve outdated index.html referencing
  // deleted asset files
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response for offline fallback
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => {
          // Network failed -- fall back to cache (offline mode)
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/pwa-demo/index.html')
          })
        })
    )
    return
  }

  // Static assets (JS, CSS, images): cache-first
  // These have content hashes in filenames so they're immutable
  if (url.pathname.match(/\.(js|css|png|jpg|svg|ico|json|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Everything else: network-first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'PWA Demo'
  const options = {
    body: data.body || 'You have a new notification!',
    icon: '/pwa-demo/icon-192.png',
    badge: '/pwa-demo/icon-192.png',
    tag: data.tag || 'default',
    requireInteraction: false,
    ...data
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/pwa-demo/') && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/pwa-demo/')
      }
    })
  )
})