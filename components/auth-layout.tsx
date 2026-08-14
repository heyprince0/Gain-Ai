'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AuthScreen } from './auth-screen'
import { ProfileSetup } from './profile-setup'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, profileLoading, hasProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // ⭐ Skip all gym‑owner routes – they handle their own auth & redirects
  if (pathname?.startsWith('/gym-owner')) {
    return <>{children}</>
  }

  const protectedRoutes = ['/dashboard', '/food-scanner', '/body-scanner']
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route))
  const isHomePage = pathname === '/'

  useEffect(() => {
    if (loading) return
    if (user && isHomePage) {
      router.replace('/dashboard')
      return
    }
  }, [user, loading, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#00ff88] border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user && isProtectedRoute) {
    return <AuthScreen />
  }

  if (user && !profileLoading && !hasProfile && isProtectedRoute) {
    return <ProfileSetup />
  }

  return <>{children}</>
}
