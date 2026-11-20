const CACHE_PREFIX = 'gainai-shell-'
const CACHE_VERSION = 'v4'
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`
const APP_ASSETS = [
  '/manifest.json',
  '/logo.png',
  '/logo-192.png',
  '/logo-512.png',
  '/apple-icon.png',
  '/icon-dark-32x32.png',
  '/icon-light-32x32.png',
  '/icon.svg',
]
const EXCLUDED_PATHS = ['/api/', '/auth/', '/checkout/']

function isExcluded(url) {
  return EXCLUDED_PATHS.some((path) => url.pathname.startsWith(path)) || url.pathname.includes('supabase')
}

function isCacheableAsset(request, url) {
  return url.pathname.startsWith('/_next/static/') || APP_ASSETS.includes(url.pathname) || ['style', 'script', 'font', 'image'].includes(request.destination)
}

async function cacheSuccessfulResponse(cache, request, response) {
  if (response.ok && response.type === 'basic') {
    try {
      await cache.put(request, response.clone())
    } catch {
      // Some framework responses cannot be stored because of their Vary headers.
    }
  }
  return response
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(APP_ASSETS)
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
  if (request.method !== 'GET' || url.origin !== self.location.origin || isExcluded(url)) return

  const isDocumentNavigation = request.mode === 'navigate'
  const isNextNavigationData = request.headers.has('RSC') || request.headers.has('Next-Router-Prefetch')
  if (!isDocumentNavigation && !isNextNavigationData && !isCacheableAsset(request, url)) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    try {
      const response = await fetch(request, { cache: 'no-store' })
      return await cacheSuccessfulResponse(cache, request, response)
    } catch {
      const cached = await cache.match(request, { ignoreSearch: isDocumentNavigation })
      if (cached) return cached
      if (isDocumentNavigation) {
        return new Response(null, { status: 503, statusText: 'Offline page not previously cached' })
      }
      return Response.error()
    }
  })())
})
