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
  const [gymBranding, setGymBranding] = useState<{ name: string; logo: string | null } | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function run() {
      console.log('[GymAccessGate] Starting checks...')

      // 1. Fetch full profile
      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('gym_id, phone, name, age, weight, height, goal')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return
      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setState('ready')
        return
      }

      // Check profile completeness
      const isProfileComplete = profileRow &&
        profileRow.name &&
        profileRow.phone &&
        profileRow.age &&
        profileRow.weight &&
        profileRow.height &&
        profileRow.goal

      console.log('[GymAccessGate] Profile complete?', isProfileComplete, profileRow)

      if (!isProfileComplete) {
        console.log('[GymAccessGate] Profile not complete – skipping install prompt')
        setState('ready')
        return
      }

      // 2. Gym access / linking
      let blocked = false
      let gymId = profileRow.gym_id

      if (gymId) {
        const { data } = await supabase
          .from('gym_members')
          .select('app_access')
          .eq('linked_profile_id', user.id)
          .eq('gym_id', gymId)
          .is('deleted_at', null)
          .maybeSingle()
        if (cancelled) return
        if (data && !data.app_access) blocked = true
      } else if (profileRow.phone) {
        const { data } = await supabase.rpc('match_and_link_member_by_phone', {
          p_phone: profileRow.phone,
        })
        const member = Array.isArray(data) ? data[0] : data
        if (cancelled) return
        if (member && !member.app_access && !member.linked_to_other) blocked = true
        if (member && member.gym_id) {
          gymId = member.gym_id
          await supabase
            .from('profiles')
            .update({ gym_id: member.gym_id })
            .eq('id', user.id)
        }
      }

      if (blocked) {
        setState('blocked')
        return
      }

      // 3. Fetch gym branding
      if (gymId) {
        const { data: gymData } = await supabase
          .from('gyms')
          .select('name, logo_url')
          .eq('id', gymId)
          .maybeSingle()
        if (gymData) {
          setGymBranding({ name: gymData.name, logo: gymData.logo_url })
        }
      }

      // 4. PWA installability
      if (isStandaloneDisplay()) {
        console.log('[GymAccessGate] Already in standalone mode – ready')
        setState('ready')
        return
      }

      const installable = await canInstallPwa()
      console.log('[GymAccessGate] PWA installable?', installable)
      if (cancelled) return

      if (installable && isProfileComplete) {
        console.log('[GymAccessGate] Showing install prompt')
        setState('show-install')
      } else {
        console.log('[GymAccessGate] Not showing install prompt (installable=' + installable + ', profileComplete=' + isProfileComplete + ')')
        setState('ready')
      }
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
    return (
      <PwaInstallPrompt
        onInstalled={() => setState('ready')}
        gymName={gymBranding?.name || 'GainAi'}
        gymLogo={gymBranding?.logo || null}
      />
    )
  }

  return <>{children}</>
}
