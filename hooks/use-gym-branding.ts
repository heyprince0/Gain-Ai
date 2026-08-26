'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type GymBranding = {
  gym_name: string
  logo_url: string | null
  brand_color: string | null
}

export function useGymBranding(gymId: string | null) {
  const [branding, setBranding] = useState<GymBranding | null>(null)

  useEffect(() => {
    if (!gymId) {
      setBranding(null)
      return
    }

    let cancelled = false

    async function fetchBranding() {
      const { data, error } = await supabase.rpc('get_gym_branding_by_id', { p_gym_id: gymId })
      if (cancelled) return
      const row = Array.isArray(data) ? data[0] : data
      if (!error && row) {
        setBranding(row as GymBranding)
      } else {
        setBranding(null)
      }
    }

    fetchBranding()
    return () => {
      cancelled = true
    }
  }, [gymId])

  return branding
}
