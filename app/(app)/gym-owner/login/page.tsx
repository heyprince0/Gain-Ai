'use client'

import { FormEvent, useState } from 'react'
import { Building2, Loader2, ArrowLeft, Chrome } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export default function GymOwnerLogin() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const redirectUrl =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/gym-owner/login`
      : undefined

  function redirectToOwnerDestination(userId: string) {
    supabase
      .from('gyms')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('[v0] Owner workspace lookup failed:', error)
          setError('We could not load your gym workspace. Please try again.')
          setBusy(false)
          return
        }
        const destination = data ? '/gym-owner/dashboard' : '/gym-owner/setup'
        console.log(`[v0] Redirecting to ${destination}`)
        window.location.replace(destination)
      })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')

    const result =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectUrl },
          })

    if (result.error) {
      console.error('[v0] Auth error:', result.error)
      const message = result.error.message.toLowerCase().includes('email not confirmed')
        ? 'Please confirm your email before signing in.'
        : mode === 'signin'
          ? 'Invalid email or password.'
          : 'Could not create account. Please check your details.'
      setError(message)
      setBusy(false)
      return
    }

    if (mode === 'signup' && !result.data.session) {
      setError('Check your email to confirm your account.')
      setBusy(false)
      return
    }

    const userId = result.data.user?.id || result.data.session?.user.id
    if (!userId) {
      setError('Unable to get user information.')
      setBusy(false)
      return
    }

    redirectToOwnerDestination(userId)
  }

  async function signInWithGoogle() {
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl },
    })
    if (error) {
      console.error('[v0] Google OAuth error:', error)
      setError(error.message)
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="mb-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to GainAi
          </Link>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Building2 />
          </div>
          <CardTitle className="pt-4 text-2xl">
            {mode === 'signin' ? 'Welcome back' : 'Create owner account'}
          </CardTitle>
          <CardDescription>Manage your gym, members, plans, and attendance in one place.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button type="button" variant="outline" className="w-full" onClick={signInWithGoogle} disabled={busy}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Chrome className="mr-2 size-4" />}
              Continue with Google
            </Button>

            <div className="relative flex items-center">
              <div className="w-full border-t border-border" />
              <span className="absolute left-1/2 -translate-x-1/2 bg-card px-2 text-xs text-muted-foreground">
                Or continue with email
              </span>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="owner-email">Email</Label>
                <Input id="owner-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="owner-password">Password</Label>
                <Input id="owner-password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <Button disabled={busy} className="w-full">
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <button
              className="mt-5 w-full text-sm text-muted-foreground hover:text-primary"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            >
              {mode === 'signin' ? 'New to GainAi Owner? Create an account' : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
