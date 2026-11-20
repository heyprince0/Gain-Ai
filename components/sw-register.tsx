'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let refreshing = false
    const handleControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }

    let registration: ServiceWorkerRegistration | undefined
    const updateWhenOnline = () => {
      if (registration) void registration.update()
    }
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    window.addEventListener('online', updateWhenOnline)
    void navigator.serviceWorker.register('/sw.js').then((value) => {
      registration = value
      if (navigator.onLine) void registration.update()
    }).catch((error) => {
      console.error('Service worker registration failed:', error)
    })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      window.removeEventListener('online', updateWhenOnline)
    }
  }, [])

  return null
}
