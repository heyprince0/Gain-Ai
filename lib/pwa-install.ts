// lib/pwa-install.ts

'use client'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

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
    }, 8000) // 8 seconds
  })
}
