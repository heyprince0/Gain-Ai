'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { canInstallPwa, isStandaloneDisplay } from '@/lib/pwa-install'
import { PwaInstallPrompt } from './pwa-install-prompt'

type GateState = 'checking' | 'blocked' | 'show-install' | 'ready'

export function GymAccessGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<GateState>('checking')

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function run() {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('gym_id, phone')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      let blocked = false

      if (profileRow?.gym_id) {
        const { data } = await supabase
          .from('gym_members')
          .select('app_access')
          .eq('linked_profile_id', user.id)
          .eq('gym_id', profileRow.gym_id)
          .is('deleted_at', null)
          .maybeSingle()
        if (cancelled) return
        if (data && !data.app_access) blocked = true
      } else if (profileRow?.phone) {
        const { data } = await supabase.rpc('match_and_link_member_by_phone', {
          p_phone: profileRow.phone,
        })
        const member = Array.isArray(data) ? data[0] : data
        if (cancelled) return
        if (member && !member.app_access && !member.linked_to_other) blocked = true
      }

      if (blocked) {
        setState('blocked')
        return
      }

      if (isStandaloneDisplay()) {
        setState('ready')
        return
      }

      const installable = await canInstallPwa()
      if (cancelled) return
      setState(installable ? 'show-install' : 'ready')
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [user])

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-[#00ff88] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (state === 'blocked') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold text-foreground">Access Not Enabled</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your gym administrator hasn't activated your GainAi access yet. Please check with your gym.
          </p>
        </div>
      </div>
    )
  }

  if (state === 'show-install') {
    return <PwaInstallPrompt onInstalled={() => setState('ready')} />
  }

  return <>{children}</>
}
