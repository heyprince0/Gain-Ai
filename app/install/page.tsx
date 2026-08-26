'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function InstallPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const getGymId = (): string | null => {
    // Check query params first (fallback)
    const fromQuery = searchParams.get('gymId') ?? searchParams.get('gym')
    if (fromQuery) return fromQuery

    // Check subdomain
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      const parts = host.split('.')
      const subdomain = parts[0]
      // Skip reserved subdomains
      if (subdomain && !['app', 'panel', 'www'].includes(subdomain)) {
        return subdomain
      }
    }

    return null
  }

  useEffect(() => {
    const gymId = getGymId()

    if (!gymId) {
      router.replace('/')
      return
    }

    // Store gym ID for client-side linking
    localStorage.setItem('gainai_pending_gym_id', gymId)

    // Set cookie on .gainai.space so it works across subdomains
    document.cookie = `gainai_pending_gym_id=${encodeURIComponent(gymId)}; path=/; domain=.gainai.space; max-age=${60 * 60 * 24 * 365}; samesite=lax`

    // Redirect to the branded member subdomain
    router.replace('https://app.gainai.space/dashboard')
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-2 border-[#00ff88] border-t-transparent animate-spin" />
    </div>
  )
}
