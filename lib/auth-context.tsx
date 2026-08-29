'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
// ✅ FIX 1: was importing from './supabase' (a second client) — now uses the singleton
import { supabaseBrowser } from './supabase-browser'
import type { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  profileLoading: boolean
  hasProfile: boolean
  gymId: string | null
  gymBranding: { gym_name: string; logo_url: string | null; primary_color: string | null } | null
  intendedRoute: string | null
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  setIntendedRoute: (route: string | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [gymId, setGymId] = useState<string | null>(null)
  const [gymBranding, setGymBranding] = useState<{
    gym_name: string
    logo_url: string | null
    primary_color: string | null
  } | null>(null)
  const [intendedRoute, setIntendedRoute] = useState<string | null>(null)
  const pathname = usePathname()

  const isGymOwnerRoute = pathname?.startsWith('/gym-owner')

  useEffect(() => {
    let mounted = true

    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabaseBrowser.auth.signUp({ email, password })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabaseBrowser.auth.signOut()
    if (error) throw error
    setHasProfile(false)
    setGymId(null)
    setGymBranding(null)
  }

  const refreshProfile = async () => {
    if (isGymOwnerRoute) {
      setHasProfile(true)
      setProfileLoading(false)
      setGymId(null)
      setGymBranding(null)
      return
    }

    if (!user) {
      setHasProfile(false)
      setProfileLoading(false)
      setGymId(null)
      setGymBranding(null)
      return
    }

    setProfileLoading(true)
    try {
      // ✅ FIX 2: was .single() → 406 crash when no profile row exists
      const { data: profile } = await supabaseBrowser
        .from('profiles')
        .select('gym_id')
        .eq('id', user.id)
        .maybeSingle()

      setHasProfile(!!profile)
      let resolvedGymId = profile?.gym_id || null

      // ✅ FIX 3: fallback to gym_members when profiles.gym_id is null
      // This covers members who haven't had gym_id written to their profile yet
      if (!resolvedGymId) {
        const { data: member } = await supabaseBrowser
          .from('gym_members')
          .select('gym_id')
          .eq('linked_profile_id', user.id)
          .is('deleted_at', null)
          .maybeSingle()

        resolvedGymId = member?.gym_id || null

        // Write gym_id back to profiles so next load skips this fallback
        if (resolvedGymId) {
          await supabaseBrowser
            .from('profiles')
            .upsert({ id: user.id, gym_id: resolvedGymId }, { onConflict: 'id' })
        }
      }

      setGymId(resolvedGymId)

      if (resolvedGymId) {
        const { data: gym } = await supabaseBrowser
          .from('gyms')
          .select('gym_name, logo_url, primary_color')
          .eq('id', resolvedGymId)
          .maybeSingle()
        setGymBranding(gym ?? null)
      } else {
        setGymBranding(null)
      }
    } catch (err) {
      console.error('refreshProfile error:', err)
      setHasProfile(false)
      setGymId(null)
      setGymBranding(null)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    if (loading) return
    refreshProfile()
  }, [user, loading, isGymOwnerRoute])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        profileLoading,
        hasProfile,
        gymId,
        gymBranding,
        intendedRoute,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
        setIntendedRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
