'use client'

import { getApp, getApps, initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

// ✅ FIX: do NOT call getMessaging() at module level
// It runs before SW is registered → Firebase doesn't know about /sw.js
// → background push silently fails or uses wrong SW

export async function requestPermissionAndGetToken(): Promise<string | null> {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    !('serviceWorker' in navigator)
  ) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  // Register SW first
  const registration = await navigator.serviceWorker.register('/sw.js')

  // ✅ Wait until SW is fully active before getting token
  // Without this, getToken can fire before SW is ready → wrong token linked
  await navigator.serviceWorker.ready

  // ✅ Get messaging AFTER SW is registered and active
  const messagingInstance = getMessaging(firebaseApp)

  const token = await getToken(messagingInstance, {
    vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
    serviceWorkerRegistration: registration, // ← ties token to YOUR sw.js
  })

  return token || null
}
