'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabaseBrowser } from './supabase-browser'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  profileLoading: boolean
  hasProfile: boolean
  intendedRoute: string | null
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
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
  const [intendedRoute, setIntendedRoute] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
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

  const signOut = async () => {
    const { error } = await supabaseBrowser.auth.signOut()
    if (error) throw error
    setHasProfile(false)
  }

  const refreshProfile = async () => {
    if (!user) {
      setHasProfile(false)
      setProfileLoading(false)
      return
    }

    setProfileLoading(true)
    try {
      const { data: profile, error } = await supabaseBrowser
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error
      setHasProfile(!!profile)
    } catch (error) {
      console.error('refreshProfile error:', error)
      setHasProfile(false)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    if (!loading) void refreshProfile()
  }, [user, loading])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      profileLoading,
      hasProfile,
      intendedRoute,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      setIntendedRoute,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
