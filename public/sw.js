const SW_VERSION = 'gainai-network-only-v2'

importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js')

// TODO: Replace with your Firebase config from .env
firebase.initializeApp({ apiKey: 'AIzaSyBv_vTmH4vkK-152mvmpYLrCuZQQ_B3GqQ', authDomain: 'gainai-message.firebaseapp.com', projectId: 'gainai-message', storageBucket: 'gainai-message.firebasestorage.app', messagingSenderId: 'ai-message.firebasestorage.app",
  messagingSenderId: "829407715292', appId: '1:829407715292:web:bf80f1b6e118aa1ca4f919' })

self.addEventListener('install', (event) => { event.waitUntil(self.skipWaiting()) })
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })
self.addEventListener('fetch', () => {
  // Network-only keeps tenant pages, manifests, images, and authenticated APIs fresh.
})

try {
  const messaging = firebase.messaging()
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'GainAI notification'
    const options = { body: payload.notification?.body || '', icon: '/logo-192.png', data: { url: payload.fcmOptions?.link || payload.data?.url || '/' } }
    self.registration.showNotification(title, options)
  })
} catch (error) { console.error('[sw] Firebase messaging unavailable', error) }

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin)
  if (target.origin !== self.location.origin) return
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => { const client = clients.find((item) => 'focus' in item); return client ? client.focus().then(() => client.navigate(target.href)) : self.clients.openWindow(target.href) }))
})

void SW_VERSION
