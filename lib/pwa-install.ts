// lib/pwa-install.ts

'use client'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

// Attach listener as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    listeners.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
  })
}

export function getDeferredInstallPrompt() {
  return deferredPrompt
}

export function onInstallPromptCaptured(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function isIOSDevice() {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/**
 * Resolves whether this browser can show a native install prompt.
 * iOS never gets one – those users skip the install step entirely.
 * Other browsers get a longer grace window (5 seconds) to catch the event.
 */
export function canInstallPwa(): Promise<boolean> {
  if (isIOSDevice()) return Promise.resolve(false)
  if (deferredPrompt) return Promise.resolve(true)

  return new Promise((resolve) => {
    const unsubscribe = onInstallPromptCaptured(() => {
      clearTimeout(timer)
      unsubscribe()
      resolve(true)
    })
    const timer = setTimeout(() => {
      unsubscribe()
      resolve(false)
    }, 5000) // Increased from 1200ms to 5000ms
  })
}
