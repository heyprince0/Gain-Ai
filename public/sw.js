const CACHE_PREFIX = 'gainai-shell-'
const CACHE_VERSION = 'v3'
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`
const OFFLINE_PAGE = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll([
      OFFLINE_PAGE,
      '/manifest.json',
      '/logo.png',
      '/logo-192.png',
      '/logo-512.png',
      '/apple-icon.png',
      '/icon-dark-32x32.png',
      '/icon-light-32x32.png',
      '/icon.svg',
    ])
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/checkout/')) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME)
      try {
        const response = await fetch(request, { cache: 'no-store' })
        const contentType = response.headers.get('Content-Type') || ''
        if (response.ok && response.type === 'basic' && contentType.includes('text/html')) {
          await cache.put(request, response.clone())
        }
        return response
      } catch {
        return (await cache.match(OFFLINE_PAGE)) || (await cache.match(request)) || Response.error()
      }
    })())
    return
  }

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') || url.pathname.includes('supabase')) return
  const isPublicAppAsset = ['/manifest.json', '/logo.png', '/logo-192.png', '/logo-512.png', '/apple-icon.png', '/icon-dark-32x32.png', '/icon-light-32x32.png', '/icon.svg'].includes(url.pathname)
  if (url.pathname.startsWith('/_next/static/') || isPublicAppAsset) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME)
      try {
        const response = await fetch(request, { cache: 'no-store' })
        if (response.ok && response.type === 'basic') await cache.put(request, response.clone())
        return response
      } catch {
        return (await cache.match(request)) || Response.error()
      }
    })())
  }
})
