'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabaseBrowser } from './supabase-browser'
import type { User } from '@supabase/supabase-js'
import { clearOfflineContent, getOfflineContent, saveOfflineContent } from './offline-storage'

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

async function getOfflineUser(): Promise<User | null> {
  try {
    const identity = await getOfflineContent<{ id: string; email: string | null }>('offline', 'identity')
    return identity ? { id: identity.id, email: identity.email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as User : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [intendedRoute, setIntendedRoute] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    void (async () => {
      try {
        const { data: { session } } = await supabaseBrowser.auth.getSession()
        if (!mounted) return
        if (session?.user) {
          setUser(session.user)
          void saveOfflineContent('offline', 'identity', { id: session.user.id, email: session.user.email ?? null }).catch(() => undefined)
        } else if (!navigator.onLine) {
          if (mounted) setUser(await getOfflineUser())
        } else {
          setUser(null)
        }
      } catch {
        if (mounted && !navigator.onLine) setUser(await getOfflineUser())
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    const refreshSession = async () => {
      try {
        const { data: { session } } = await supabaseBrowser.auth.getSession()
        if (mounted) setUser(session?.user ?? null)
      } catch {
        if (mounted) setUser(null)
      }
    }
    window.addEventListener('online', refreshSession)

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        const sessionUser = session?.user ?? null
        setLoading(false)
        if (sessionUser) {
          setUser(sessionUser)
          void saveOfflineContent('offline', 'identity', { id: sessionUser.id, email: sessionUser.email ?? null }).catch(() => undefined)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          void clearOfflineContent('offline').catch(() => undefined)
        } else if (!navigator.onLine) {
          void getOfflineUser().then((offlineUser) => { if (mounted) setUser(offlineUser) })
        } else {
          setUser(null)
        }
      }
    })

    return () => {
      mounted = false
      window.removeEventListener('online', refreshSession)
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
    await Promise.all([
      user ? clearOfflineContent(user.id) : Promise.resolve(),
      clearOfflineContent('offline'),
    ]).catch(() => undefined)
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
      if (!navigator.onLine) {
        const cachedDashboard = await getOfflineContent<{ profile?: unknown }>(user.id, 'dashboard')
        setHasProfile(Boolean(cachedDashboard?.profile))
        setProfileLoading(false)
        return
      }

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
