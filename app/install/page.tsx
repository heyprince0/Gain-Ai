'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function InstallPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gymId = searchParams.get('gym')

  useEffect(() => {
    if (gymId) {
      // localStorage is read by the client-side linking/access-check logic.
      localStorage.setItem('gainai_pending_gym_id', gymId)
      // The cookie is what lets the server render gym-branded metadata
      // (the dynamic manifest, page title) before any of that JS runs —
      // localStorage alone isn't visible during server rendering.
      document.cookie = `gainai_pending_gym_id=${encodeURIComponent(gymId)}; path=/; max-age=${60 * 60 * 24 * 7}`
    }
    // Straight to the sign-in screen — /dashboard is a protected route, so an
    // unauthenticated visitor lands directly on AuthScreen with no detour.
    router.replace('/dashboard')
  }, [gymId, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-2 border-[#00ff88] border-t-transparent animate-spin" />
    </div>
  )
}
