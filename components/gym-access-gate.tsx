'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { canInstallPwa, isStandaloneDisplay } from '@/lib/pwa-install'
import { PwaInstallPrompt } from './pwa-install-prompt'

type GateState = 'checking' | 'blocked' | 'show-install' | 'ready'

export function GymAccessGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<GateState>('checking')
  const generationRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const generation = ++generationRef.current
    if (!user) {
      setState('checking')
      return
    }
    const userId = user.id

    async function run() {
      const { data: profileRow } = await supabase.from('profiles').select('gym_id, phone').eq('id', userId).maybeSingle()
      if (generation !== generationRef.current) return
      let blocked = false

      if (profileRow?.gym_id) {
        const { data } = await supabase.from('gym_members').select('app_access').eq('linked_profile_id', user.id).eq('gym_id', profileRow.gym_id).is('deleted_at', null).maybeSingle()
        if (generation !== generationRef.current) return
        blocked = Boolean(data && !data.app_access)
      } else if (profileRow?.phone) {
        const { data } = await supabase.rpc('match_and_link_member_by_phone', { p_phone: profileRow.phone })
        if (generation !== generationRef.current) return
        const member = Array.isArray(data) ? data[0] : data
        blocked = Boolean(member && !member.app_access && !member.linked_to_other)
      }

      if (blocked) {
        setState('blocked')
        return
      }
      if (isStandaloneDisplay()) {
        setState('ready')
        return
      }
      setState((await canInstallPwa()) ? 'show-install' : 'ready')
    }

    void run()
    return () => {
      generationRef.current++
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [user])

  useEffect(() => {
    if (state !== 'ready' || isStandaloneDisplay()) return
    let attempts = 0
    const poll = async () => {
      if (++attempts > 2 || generationRef.current === 0) return
      if (await canInstallPwa()) {
        setState('show-install')
        return
      }
      timerRef.current = setTimeout(poll, 2000)
    }
    timerRef.current = setTimeout(poll, 1000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [state])

  if (state === 'checking') return <div className="flex min-h-screen items-center justify-center bg-background"><div className="size-8 animate-spin rounded-full border-2 border-[#00ff88] border-t-transparent" /></div>
  if (state === 'blocked') return <div className="flex min-h-screen items-center justify-center bg-background p-4 text-center"><div className="max-w-sm"><h1 className="text-xl font-semibold text-foreground">Access Not Enabled</h1><p className="mt-2 text-sm text-muted-foreground">Your gym administrator hasn&apos;t activated your GainAi access yet. Please check with your gym.</p></div></div>
  if (state === 'show-install') return <PwaInstallPrompt onInstalled={() => setState('ready')} />
  return <>{children}</>
}
