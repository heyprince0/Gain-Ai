'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AuthScreen } from './auth-screen'
import { ProfileSetup } from './profile-setup'
import { GymAccessGate } from './gym-access-gate'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname?.startsWith('/gym-owner')) {
    return <>{children}</>
  }

  return <MemberAuthLayout>{children}</MemberAuthLayout>
}

function MemberAuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, profileLoading, hasProfile, gymBranding } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const protectedRoutes = ['/dashboard', '/food-scanner', '/body-scanner']
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route))
  const isHomePage = pathname === '/'

  useEffect(() => {
    if (!loading && user && isHomePage) {
      router.replace('/dashboard')
    }
  }, [user, loading, isHomePage, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1318]">
        <div className="flex flex-col items-center gap-4">
          {gymBranding?.logo_url ? (
            <img
              src={gymBranding.logo_url}
              alt={gymBranding.gym_name}
              className="h-16 w-16 rounded-2xl object-cover animate-pulse"
            />
          ) : (
            <div className="h-8 w-8 rounded-full border-2 border-[#00ff88] border-t-transparent animate-spin" />
          )}
          {gymBranding && (
            <p className="text-white font-semibold">{gymBranding.gym_name}</p>
          )}
        </div>
      </div>
    )
  }

  if (!user && isProtectedRoute) return <AuthScreen />
  if (user && !profileLoading && !hasProfile && isProtectedRoute) return <ProfileSetup />
  if (user && hasProfile && isProtectedRoute) return <GymAccessGate>{children}</GymAccessGate>
  return <>{children}</>
}
