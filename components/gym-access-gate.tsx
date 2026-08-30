'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

type GateState = 'checking' | 'blocked' | 'ready'

export function GymAccessGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<GateState>('checking')
  const generationRef = useRef(0)

  useEffect(() => {
    const generation = ++generationRef.current
    if (!user) {
      setState('checking')
      return
    }
    const userId = user.id

    async function run() {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('gym_id, phone')
        .eq('id', userId)
        .maybeSingle()
      if (generation !== generationRef.current) return
      let blocked = false

      if (profileRow?.gym_id) {
        const { data } = await supabase
          .from('gym_members')
          .select('app_access')
          .eq('linked_profile_id', user.id)
          .eq('gym_id', profileRow.gym_id)
          .is('deleted_at', null)
          .maybeSingle()
        if (generation !== generationRef.current) return
        blocked = Boolean(data && !data.app_access)
      } else if (profileRow?.phone) {
        const { data } = await supabase.rpc('match_and_link_member_by_phone', {
          p_phone: profileRow.phone
        })
        if (generation !== generationRef.current) return
        const member = Array.isArray(data) ? data[0] : data
        blocked = Boolean(member && !member.app_access && !member.linked_to_other)
      }

      if (blocked) {
        setState('blocked')
      } else {
        // ✅ Always go to 'ready' – no install prompt
        setState('ready')
      }
    }

    void run()
    return () => {
      generationRef.current++
    }
  }, [user])

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-[#00ff88] border-t-transparent" />
      </div>
    )
  }

  if (state === 'blocked') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold text-foreground">Access Not Enabled</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your gym administrator hasn&apos;t activated your GainAi access yet. Please check with your gym.
          </p>
        </div>
      </div>
    )
  }

  // state === 'ready' → render children
  return <>{children}</>
}
