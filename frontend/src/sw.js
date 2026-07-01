const CACHE_VERSION = 'v2'
const STATIC_CACHE = `moneysaver-static-${CACHE_VERSION}`
const API_CACHE = `moneysaver-api-${CACHE_VERSION}`
const DYNAMIC_CACHE = `moneysaver-dynamic-${CACHE_VERSION}`
const OFFLINE_URL = '/offline.html'

const PRECACHE_MANIFEST = (self.__WB_MANIFEST || []).map((entry) => entry.url)

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      const urlsToCache = [...PRECACHE_MANIFEST, OFFLINE_URL, '/']
      await cache.addAll(urlsToCache)
      await self.skipWaiting()
    })().catch(() => {
      self.skipWaiting()
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      )
      await self.clients.claim()
    })()
  )
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const clone = response.clone()
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, clone)
    }
    return response
  } catch {
    return caches.match(OFFLINE_URL).then((r) => r || new Response('Offline', { status: 503 }))
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const clone = response.clone()
      const cache = await caches.open(API_CACHE)
      cache.put(request, clone)
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'You are offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => cached)
  return cached || fetchPromise
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    if (request.destination === 'font' || request.destination === 'style') {
      event.respondWith(cacheFirst(request))
    }
    return
  }

  if (url.pathname.startsWith('/api/')) {
    if (request.method !== 'GET') {
      event.respondWith(
        fetch(request).catch(() =>
          new Response(JSON.stringify({ error: 'You are offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      )
      return
    }
    event.respondWith(networkFirst(request))
    return
  }

  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then((r) => r || caches.match(OFFLINE_URL))
      )
    )
    return
  }

  if (request.method === 'GET') {
    event.respondWith(cacheFirst(request))
  }
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const options = {
    title: data.title || 'Money Vault',
    body: data.message || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: data.actions || [],
  }
  event.waitUntil(self.registration.showNotification(options.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const urlToOpen = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(urlToOpen)
    })
  )
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(
      fetch('/api/transactions/sync', { method: 'POST' }).catch(() => {})
    )
  }
})
