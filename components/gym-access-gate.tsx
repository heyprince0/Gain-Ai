'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { PwaInstallPrompt } from './pwa-install-prompt'

const PENDING_GYM_KEY = 'gainai_pending_gym_id'

type GateState = 'checking' | 'blocked' | 'show-install' | 'ready'

function isStandaloneNow() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function GymAccessGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<GateState>('checking')

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function run() {
      // Fetch the profile row directly rather than depending on whatever
      // shape useAuth() exposes — this only needs gym_id and phone, and
      // this way it works regardless of what the auth context does or
      // doesn't include.
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('gym_id, phone')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (!profileRow) {
        // Shouldn't happen at this point (profile setup already completed
        // before this gate ever renders), but don't hang forever if it does.
        setState(isStandaloneNow() ? 'ready' : 'show-install')
        return
      }

      // Already permanently linked to a gym — re-check access on every load.
      if (profileRow.gym_id) {
        const { data } = await supabase
          .from('gym_members')
          .select('app_access')
          .eq('linked_profile_id', user.id)
          .eq('gym_id', profileRow.gym_id)
          .is('deleted_at', null)
          .maybeSingle()
        if (cancelled) return
        if (data && !data.app_access) {
          setState('blocked')
          return
        }
        setState(isStandaloneNow() ? 'ready' : 'show-install')
        return
      }

      // Not linked yet — only relevant if they arrived via a gym's install QR.
      const pendingGymId = localStorage.getItem(PENDING_GYM_KEY)
      if (pendingGymId && profileRow.phone) {
        const { data } = await supabase.rpc('match_and_link_member', {
          p_gym_id: pendingGymId,
          p_phone: profileRow.phone,
        })
        const member = Array.isArray(data) ? data[0] : data
        localStorage.removeItem(PENDING_GYM_KEY)
        if (cancelled) return
        if (member && !member.app_access && !member.linked_to_other) {
          setState('blocked')
          return
        }
        setState(isStandaloneNow() ? 'ready' : 'show-install')
        return
      }

      // No gym context at all — completely unaffected, exactly as before.
      setState(isStandaloneNow() ? 'ready' : 'show-install')
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
