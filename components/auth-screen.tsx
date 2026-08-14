'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Chrome } from 'lucide-react'

export function AuthScreen() {
  const router = useRouter()
  const { signUp, signIn, signInWithGoogle } = useAuth()
  const [role, setRole] = useState<'member' | 'owner'>('member')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (role === 'owner') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center"><CardTitle className="text-2xl">Choose your GainAi workspace</CardTitle><CardDescription>Use the member app or manage your gym.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-3"><Button className="h-16 justify-start text-left" onClick={() => router.push('/gym-owner/login')}><span><span className="block font-semibold">Gym Owner</span><span className="text-xs font-normal opacity-80">Manage members, plans, and attendance</span></span></Button><Button variant="outline" className="h-16 justify-start text-left" onClick={() => setRole('member')}><span><span className="block font-semibold">Member</span><span className="text-xs font-normal text-muted-foreground">Use the GainAi fitness app</span></span></Button></CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">GainAi</CardTitle>
          <CardDescription>
            {isSignUp ? 'Create an account to get started' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            <Button type="button" variant="secondary" className="h-11" onClick={() => setRole('member')}>Member</Button>
            <Button type="button" variant="ghost" className="h-11" onClick={() => setRole('owner')}>Gym Owner</Button>
          </div>
          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              variant="outline"
              className="w-full"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-4 w-4" />
                  Continue with Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                  }}
                  className="text-primary hover:underline font-medium"
                  disabled={loading}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
