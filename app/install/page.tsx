'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function InstallPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gymId = searchParams.get('gymId') ?? searchParams.get('gym')

  useEffect(() => {
    if (!gymId) {
      router.replace('/')
      return
    }

    // localStorage is read by the client-side linking/access-check logic.
    localStorage.setItem('gainai_pending_gym_id', gymId)

    // The cookie is what lets the server render gym-branded metadata
    // (the dynamic manifest, page title) before any of that JS runs.
    // Add domain=.gainai.space so it works across all subdomains.
    document.cookie = `gainai_pending_gym_id=${encodeURIComponent(gymId)}; path=/; domain=.gainai.space; max-age=${60 * 60 * 24 * 365}; samesite=lax`

    // 🔁 Redirect to the branded member subdomain
    router.replace('https://app.gainai.space/dashboard')
  }, [gymId, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-2 border-[#00ff88] border-t-transparent animate-spin" />
    </div>
  )
}
