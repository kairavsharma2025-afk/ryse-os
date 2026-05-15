/* Ryse — minimal service worker: app-shell offline + runtime asset cache.
   Bump CACHE when you want every client to drop its old cached assets. */
const CACHE = 'ryse-v3'
const APP_SHELL = ['/', '/index.html', '/icon.svg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // Leave cross-origin traffic alone (Anthropic API, font/emoji CDNs, etc.)
  if (url.origin !== self.location.origin) return
  // Never cache the backend API (sync, auth) — always go to the network.
  if (url.pathname.startsWith('/api/')) return

  // SPA navigations: try the network, fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    )
    return
  }

  // Same-origin static assets (hashed JS/CSS, icons): cache-first, then network (and cache it).
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((res) => {
            if (res && res.ok && res.type === 'basic') {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(request, copy))
            }
            return res
          })
          .catch(() => cached)
    )
  )
})

/* Web Push — fires when the browser/phone is closed, as long as the user
   granted notification permission and the device has an active subscription.
   The server (api/cron/push-dispatch) sends a JSON payload that we unpack
   into a native OS notification. */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    /* malformed payload — fall back to defaults */
  }
  const title = data.title || 'Ryse'
  const options = {
    body: data.body || '',
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: data.tag || 'ryse',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      // Reuse an existing tab if we have one — saves the user a reload.
      for (const w of wins) {
        if ('focus' in w) {
          w.navigate(target)
          return w.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
    })
  )
})
