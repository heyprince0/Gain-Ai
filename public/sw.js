const SW_VERSION = 'gainai-network-only-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Deliberately do not call respondWith: every tenant page, manifest,
  // image, and authenticated API request must stay network-fresh.
})

void SW_VERSION
