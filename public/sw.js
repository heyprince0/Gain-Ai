const SW_VERSION = 'gainai-v5'

importScripts(
  'https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js'
)

firebase.initializeApp({
  apiKey: 'AIzaSyBv_vTmH4vkK-152mvmpYLrCuZQQ_B3GqQ',
  authDomain: 'gainai-message.firebaseapp.com',
  projectId: 'gainai-message',
  storageBucket: 'gainai-message.firebasestorage.app',
  messagingSenderId: '829407715292',
  appId: '1:829407715292:web:bf80f1b6e118aa1ca4f919',
})

self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()))
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})

const messaging = firebase.messaging()

// This fires ONLY for data-only messages (no notification field)
// For messages WITH notification field, Firebase shows them automatically
// using webpush.notification settings (icon, badge, vibrate) — no SW needed
messaging.onBackgroundMessage((payload) => {
  // Only manually show notification for data-only messages
  // (fallback — normal sends use notification + webpush.notification)
  if (!payload.notification) {
    const title = payload.data?.title || 'Notification'
    const body  = payload.data?.body  || ''
    const icon  = payload.data?.gym_logo || '/logo-192.png'
    const url   = payload.data?.url   || '/'

    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/logo-96.png',
      vibrate: [200, 100, 200],
      data: { url },
    })
  }
})

// Handle notification tap → open correct URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  const target = new URL(url, self.location.origin)
  if (target.origin !== self.location.origin) return
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => 'focus' in c)
        return existing
          ? existing.focus().then(() => existing.navigate(target.href))
          : self.clients.openWindow(target.href)
      })
  )
})

void SW_VERSION
