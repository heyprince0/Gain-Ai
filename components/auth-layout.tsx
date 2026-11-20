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

  const protectedRoutes = ['/dashboard', '/food-scanner', '/body-scanner', '/progress', '/profile', '/download', '/install']
  const isProtectedRoute = protectedRoutes.some((route) => pathname?.startsWith(route))
  const isHomePage = pathname === '/'

  useEffect(() => {
    if (!loading && user && isHomePage) router.replace('/dashboard')
  }, [user, loading, isHomePage, router])

  if (loading || (!loading && !!user && isHomePage)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />
      </div>
    )
  }

  if (!user && isProtectedRoute) return <AuthScreen />
  if (user && !profileLoading && !hasProfile && isProtectedRoute) return <ProfileSetup />

  return <>{children}</>
}
