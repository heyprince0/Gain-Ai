'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

export type GymBranding = {
  gym_name: string
  logo_url: string | null
  primary_color: string | null
}

function readPendingGymIdCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find((c) => c.startsWith('gainai_pending_gym_id='))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

/**
 * Resolves gym branding to show instead of plain "GainAi" — pass a known
 * gym_id once someone's logged in and linked; before that, this falls
 * back to the pending-gym cookie set by the /install redirector, so
 * branding can already show on the sign-in screen itself.
 */
export function useGymBranding(gymId?: string | null): GymBranding | null {
  const [branding, setBranding] = useState<GymBranding | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const targetId = gymId ?? readPendingGymIdCookie()
      if (!targetId) {
        setBranding(null)
        return
      }

      const { data } = await supabase.rpc('get_gym_branding_by_id', { p_gym_id: targetId })
      const row = Array.isArray(data) ? data[0] : data
      if (!cancelled) setBranding(row ?? null)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [gymId])

  return branding
}
