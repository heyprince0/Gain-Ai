'use client'

import { useState } from 'react'
import { Bell, CheckCircle2, Loader2 } from 'lucide-react'
import { requestPermissionAndGetToken } from '@/lib/firebase/client'
import { supabaseBrowser } from '@/lib/supabase-browser'

export function NotificationPermission({ gymId, onSuccess }: { gymId: string; onSuccess?: () => void }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('Stay in the loop with reminders and updates.')
  async function enable() {
    setState('loading')
    try {
      const token = await requestPermissionAndGetToken()
      if (!token) throw new Error('Notifications were not enabled.')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Please sign in again.')
      const response = await fetch('/api/notifications/register', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ member_id: session.user.id, gym_id: gymId, fcm_token: token, device_type: 'web', browser: navigator.userAgent }) })
      if (!response.ok) throw new Error('Unable to register this device.')
      setState('success'); setMessage('Notifications are enabled for this device.');
      if (onSuccess) onSuccess();// <-- Add this line
    } catch (error) { setState('error'); setMessage(error instanceof Error ? error.message : 'Something went wrong.') }
  }
  return <section className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center gap-4"><div className="rounded-xl bg-primary/10 p-3 text-primary">{state === 'success' ? <CheckCircle2 className="size-5" /> : <Bell className="size-5" />}</div><div><h2 className="font-semibold">Enable Notifications</h2><p className="text-sm text-muted-foreground">{message}</p></div></div><button type="button" onClick={enable} disabled={state === 'loading' || state === 'success'} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">{state === 'loading' ? <Loader2 className="size-4 animate-spin" /> : state === 'success' ? 'Enabled' : 'Enable'}</button></section>
}
