'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CloudOff, Wifi } from 'lucide-react'

export function OfflineStatus() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return (
    <Badge variant={online ? 'secondary' : 'outline'} role="status" aria-live="polite" className="gap-1.5 rounded-full px-2.5 py-1 text-xs">
      {online ? <Wifi aria-hidden="true" /> : <CloudOff aria-hidden="true" />}
      {online ? 'Online' : 'Offline'}
    </Badge>
  )
}
