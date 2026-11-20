'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'

type SignUpStep = 'email' | 'password'

export function AuthScreen() {
  const { signUp, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [step, setStep] = useState<SignUpStep>('email')
  const [confirmationSent, setConfirmationSent] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('signup') === '1') setIsSignUp(true)
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (isSignUp && step === 'email') {
      setStep('password')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email, password)
        setConfirmationSent(true)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const beginSignUp = () => {
    setIsSignUp(true)
    setStep('email')
    setError('')
    setConfirmationSent(false)
  }

  if (confirmationSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>Confirm your email address to continue to your personal details.</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">We sent a confirmation link to {email}.</CardContent>
        </Card>
      </main>
    )
  }

  const signupEmailStep = isSignUp && step === 'email'

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{isSignUp ? 'Create your GainAI account' : 'Welcome back'}</CardTitle>
          <CardDescription>
            {signupEmailStep ? 'Step 1 of 2 · Start with your email' : isSignUp ? 'Step 2 of 2 · Choose a password' : 'Sign in to continue your fitness journey'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(!isSignUp || signupEmailStep) && (
              <div>
                <label htmlFor="auth-email" className="mb-1 block text-sm font-medium">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  required
                  disabled={loading}
                />
              </div>
            )}
            {(!isSignUp || !signupEmailStep) && (
              <div>
                <label htmlFor="auth-password" className="mb-1 block text-sm font-medium">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  required
                  disabled={loading}
                />
              </div>
            )}

            {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />{isSignUp ? 'Creating account…' : 'Signing in…'}</> : signupEmailStep ? 'Continue' : isSignUp ? 'Create account' : 'Sign in'}
            </Button>

            {isSignUp && step === 'password' && (
              <button type="button" onClick={() => setStep('email')} className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" /> Change email
              </button>
            )}

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{isSignUp ? 'Already have an account? ' : "Don’t have an account? "}</span>
              <button type="button" onClick={() => isSignUp ? (setIsSignUp(false), setStep('email')) : beginSignUp()} className="font-medium text-primary hover:underline">
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
