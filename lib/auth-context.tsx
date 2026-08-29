'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  profileLoading: boolean
  hasProfile: boolean
  gymId: string | null // ✅ ADD THIS NEW FIELD
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
  const [gymId, setGymId] = useState<string | null>(null) // ✅ ADD THIS NEW STATE
  const [gymBranding, setGymBranding] = useState<{ gym_name: string; logo_url: string | null; primary_color: string | null } | null>(null)
  const [intendedRoute, setIntendedRoute] = useState<string | null>(null)
  const pathname = usePathname()

  const isGymOwnerRoute = pathname?.startsWith('/gym-owner')

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
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
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setHasProfile(false)
    setGymId(null) // ✅ CLEAR THE GYM ID
    setGymBranding(null)
  }

  const refreshProfile = async () => {
    if (isGymOwnerRoute) {
      setHasProfile(true)
      setProfileLoading(false)
      setGymId(null) // Gym owners don't have a member gym ID
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
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('gym_id')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      const hasProfileData = !!profile
      setHasProfile(hasProfileData)

      // ✅ STORE THE GYM ID IN STATE
      const userGymId = profile?.gym_id || null
      setGymId(userGymId)

      if (userGymId) {
        const { data: gym } = await supabase
          .from('gyms')
          .select('gym_name, logo_url, primary_color')
          .eq('id', userGymId)
          .single()
        setGymBranding(gym ?? null)
      } else {
        setGymBranding(null)
      }
    } catch {
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
        gymId, // ✅ EXPOSE THE GYM ID
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
