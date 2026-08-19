'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Download, Share, SquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export default function InstallPage() {
  const searchParams = useSearchParams()
  const gymId = searchParams.get('gym')

  const [gymName, setGymName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showIOSSteps, setShowIOSSteps] = useState(false)

  useEffect(() => {
    if (!gymId) {
      setLoading(false)
      return
    }
    localStorage.setItem('gainai_pending_gym_id', gymId)
    supabase
      .rpc('get_gym_name', { p_gym_id: gymId })
      .then(({ data }) => {
        setGymName((data as string) ?? null)
        setLoading(false)
      })
  }, [gymId])

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true)
      return
    }
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstallClick() {
    if (isIOS()) {
      setShowIOSSteps(true)
      return
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setDeferredPrompt(null)
      return
    }
    // No native prompt available (already installed, unsupported browser, etc.)
    setShowIOSSteps(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Image src="/logo.png" alt="GainAi" width={40} height={40} className="rounded-lg" />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : gymName ? (
            <>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Welcome to {gymName}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Install the GainAi app to track your meals, workouts, and gym attendance.
                </p>
              </div>

              {installed ? (
                <p className="rounded-lg bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                  App installed — open GainAi from your home screen to sign in.
                </p>
              ) : showIOSSteps ? (
                <div className="w-full rounded-xl border border-border/50 bg-muted/40 p-4 text-left text-sm text-foreground">
                  <p className="mb-2 font-medium">Add GainAi to your home screen:</p>
                  <ol className="flex flex-col gap-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Share className="size-4 shrink-0" />
                      Tap the Share button in Safari
                    </li>
                    <li className="flex items-center gap-2">
                      <SquarePlus className="size-4 shrink-0" />
                      Tap "Add to Home Screen"
                    </li>
                  </ol>
                </div>
              ) : (
                <Button className="w-full" onClick={handleInstallClick}>
                  <Download data-icon="inline-start" />
                  Install GainAi App
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              This install link isn't valid. Please ask your gym for the correct QR code.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
