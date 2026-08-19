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

export function PwaInstallPrompt({ onInstalled }: { onInstalled: () => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSSteps, setShowIOSSteps] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const promptHandler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    // The browser's real signal that installation actually completed —
    // this is what lets the screen go away, not a dismiss button.
    const installedHandler = () => onInstalled()

    window.addEventListener('beforeinstallprompt', promptHandler)
    window.addEventListener('appinstalled', installedHandler)
    return () => {
      window.removeEventListener('beforeinstallprompt', promptHandler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [onInstalled])

  async function handleInstallClick() {
    if (isIOS()) {
      setShowIOSSteps(true)
      return
    }
    if (deferredPrompt) {
      setInstalling(true)
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      setInstalling(false)
      setDeferredPrompt(null)
      if (outcome === 'accepted') onInstalled()
    }
    // If no prompt is available yet, the browser is still preparing it —
    // there's nothing to fall back to here, deliberately, since this step
    // isn't meant to be skippable.
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Image src="/logo.png" alt="GainAi" width={40} height={40} className="rounded-lg" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-foreground">One last step</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Install GainAi on your home screen to continue.
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
              <p className="mt-3 text-xs text-muted-foreground">
                Then open GainAi from your home screen icon to continue.
              </p>
            </div>
          ) : (
            <Button className="w-full" onClick={handleInstallClick} disabled={installing}>
              <Download data-icon="inline-start" />
              {installing ? 'Installing...' : 'Install GainAi App'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
