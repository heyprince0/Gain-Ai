'use client'

import { useEffect, useState } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export function SpeedInsightsWrapper() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Check if navigation entry exists
    const check = () => {
      if (typeof performance !== 'undefined' && performance.getEntriesByType) {
        const nav = performance.getEntriesByType('navigation')
        if (nav && nav.length > 0) {
          setReady(true)
          return
        }
      }
      // Fallback: wait 100ms
      setTimeout(() => setReady(true), 100)
    }
    check()
  }, [])

  if (!ready) return null
  return <SpeedInsights />
}
