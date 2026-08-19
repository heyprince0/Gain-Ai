'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download, Share, SquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export function PwaInstallPrompt({ onContinue }: { onContinue: () => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSSteps, setShowIOSSteps] = useState(false)

  useEffect(() => {
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
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      onContinue()
      return
    }
    // No native prompt available — nothing more we can do here, let them through.
    onContinue()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Image src="/logo.png" alt="GainAi" width={40} height={40} className="rounded-lg" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-foreground">Get the best experience</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Install GainAi on your home screen for faster access and a full-screen app feel.
            </p>
          </div>

          {showIOSSteps ? (
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
              <Button variant="outline" className="mt-4 w-full" onClick={onContinue}>
                Done
              </Button>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <Button className="w-full" onClick={handleInstallClick}>
                <Download data-icon="inline-start" />
                Install GainAi App
              </Button>
              <button onClick={onContinue} className="text-sm text-muted-foreground hover:underline">
                Continue in browser
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
