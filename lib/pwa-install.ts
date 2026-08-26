'use client'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let promptConsumed = false
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    promptConsumed = false
    notifyListeners()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    promptConsumed = true
    notifyListeners()
  })
}

export function getDeferredInstallPrompt() {
  return deferredPrompt && !promptConsumed ? deferredPrompt : null
}

export function consumeDeferredInstallPrompt() {
  promptConsumed = true
  deferredPrompt = null
}

export function onInstallPromptCaptured(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isIOSDevice() {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
}

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function canInstallPwa(): Promise<boolean> {
  if (isStandaloneDisplay() || isIOSDevice()) return Promise.resolve(false)
  if (getDeferredInstallPrompt()) return Promise.resolve(true)

  return new Promise((resolve) => {
    let settled = false
    const finish = (value: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      unsubscribe()
      resolve(value)
    }
    const unsubscribe = onInstallPromptCaptured(() => finish(Boolean(getDeferredInstallPrompt())))
    const timer = setTimeout(() => finish(Boolean(getDeferredInstallPrompt())), 2000)
  })
}
