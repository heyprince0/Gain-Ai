'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { PwaInstallPrompt } from './pwa-install-prompt'

const PENDING_GYM_KEY = 'gainai_pending_gym_id'
const INSTALL_DISMISSED_KEY = 'gainai_install_dismissed'

type GateState = 'checking' | 'blocked' | 'show-install' | 'ready'

function isStandaloneNow() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function nextStateAfterAccessOk(): GateState {
  const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY)
  return isStandaloneNow() || dismissed ? 'ready' : 'show-install'
}

export function GymAccessGate({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const [state, setState] = useState<GateState>('checking')

  useEffect(() => {
    if (!user || !profile) return
    let cancelled = false

    async function run() {
      // Already permanently linked to a gym — re-check access on every load,
      // same as the existing "Access Not Enabled" behavior.
      if (profile.gym_id) {
        const { data } = await supabase
          .from('gym_members')
          .select('app_access')
          .eq('linked_profile_id', user.id)
          .eq('gym_id', profile.gym_id)
          .is('deleted_at', null)
          .maybeSingle()
        if (cancelled) return
        if (data && !data.app_access) {
          setState('blocked')
          return
        }
        setState(nextStateAfterAccessOk())
        return
      }

      // Not linked yet — only check if they actually arrived via a specific
      // gym's install QR. Anyone else skips this entirely.
      const pendingGymId = localStorage.getItem(PENDING_GYM_KEY)
      if (pendingGymId && profile.phone) {
        const { data } = await supabase.rpc('match_and_link_member', {
          p_gym_id: pendingGymId,
          p_phone: profile.phone,
        })
        const member = Array.isArray(data) ? data[0] : data
        localStorage.removeItem(PENDING_GYM_KEY)
        if (cancelled) return
        if (member && !member.app_access && !member.linked_to_other) {
          setState('blocked')
          return
        }
        setState(nextStateAfterAccessOk())
        return
      }

      // No gym context at all — completely unaffected, exactly as before.
      setState(nextStateAfterAccessOk())
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [user, profile])

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
    return (
      <PwaInstallPrompt
        onContinue={() => {
          localStorage.setItem(INSTALL_DISMISSED_KEY, 'true')
          setState('ready')
        }}
      />
    )
  }

  return <>{children}</>
}
