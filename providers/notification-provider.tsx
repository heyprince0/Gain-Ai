'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { onMessage } from 'firebase/messaging'
import { messaging } from '@/lib/firebase/client'
import { NotificationToast } from '@/components/notification-toast'

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null)
  useEffect(() => { if (!messaging) return; return onMessage(messaging, (payload) => { setToast({ title: payload.notification?.title || 'New notification', body: payload.notification?.body || '' }) }) }, [])
  return <>{children}{toast && <NotificationToast {...toast} onClose={() => setToast(null)} />}</>
}

// Add to app/layout.tsx: import { NotificationProvider } from '@/providers/notification-provider'
