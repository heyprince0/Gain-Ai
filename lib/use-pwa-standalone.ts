'use client'

import { useEffect, useState } from 'react'

export function usePwaStandalone() {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches
    const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsStandalone(standaloneMedia || iosStandalone)
  }, [])

  return isStandalone
}
