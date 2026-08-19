'use client'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

// Registered at module scope so it runs the moment this file is first
// imported — as early as possible in the page's life — instead of only
// once some deeply-nested component mounts. beforeinstallprompt typically
// fires once per page load; a late listener can miss it entirely.
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
 * Resolves whether this browser can actually show a native install prompt.
 * iOS never gets one (Apple doesn't expose the API) — those users skip the
 * install step entirely rather than being shown instructions with no way
 * to verify completion. Other browsers get a short grace window in case
 * the event just hasn't fired yet.
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
    }, 1200)
  })
}
