'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AuthScreen } from './auth-screen'
import { ProfileSetup } from './profile-setup'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Owner routes own their session and redirect decisions. Do not initialize
  // member profile checks while an owner page is being rendered.
  if (pathname?.startsWith('/gym-owner')) {
    return <>{children}</>
  }

  return <MemberAuthLayout>{children}</MemberAuthLayout>
}

function MemberAuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, profileLoading, hasProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const protectedRoutes = ['/dashboard', '/food-scanner', '/body-scanner']
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route))
  const isHomePage = pathname === '/'

  useEffect(() => {
    if (!loading && user && isHomePage) router.replace('/dashboard')
  }, [user, loading, isHomePage, router])

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

  if (!user && isProtectedRoute) return <AuthScreen />
  if (user && !profileLoading && !hasProfile && isProtectedRoute) return <ProfileSetup />
  return <>{children}</>
}
