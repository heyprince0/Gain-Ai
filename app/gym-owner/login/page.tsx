'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export default function GymOwnerLogin() {
  const router = useRouter(); const [mode, setMode] = useState<'signin' | 'signup'>('signin'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { if (data.session) router.replace('/gym-owner/dashboard') }) }, [router])
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(''); const result = mode === 'signin' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/gym-owner/dashboard` } }); if (result.error) setError(result.error.message); else if (mode === 'signup' && !result.data.session) setError('Check your email to confirm your account.'); else router.replace('/gym-owner/dashboard'); setBusy(false) }
  return <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4"><Card className="w-full max-w-md"><CardHeader><Link href="/" className="mb-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to GainAi</Link><div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Building2 /></div><CardTitle className="pt-4 text-2xl">{mode === 'signin' ? 'Welcome back' : 'Create owner account'}</CardTitle><CardDescription>Manage your gym, members, plans, and attendance in one place.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="flex flex-col gap-4"><div className="flex flex-col gap-2"><Label htmlFor="owner-email">Email</Label><Input id="owner-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div><div className="flex flex-col gap-2"><Label htmlFor="owner-password">Password</Label><Input id="owner-password" type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required /></div>{error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button disabled={busy} className="w-full">{busy && <Loader2 className="animate-spin" data-icon="inline-start" />}{mode === 'signin' ? 'Sign in' : 'Create account'}</Button></form><button className="mt-5 w-full text-sm text-muted-foreground hover:text-primary" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}>{mode === 'signin' ? 'New to GainAi Owner? Create an account' : 'Already have an account? Sign in'}</button></CardContent></Card></main>
}
