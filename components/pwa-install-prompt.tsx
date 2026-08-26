'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download, Share2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDeferredInstallPrompt, isIOSDevice, isStandaloneDisplay } from '@/lib/pwa-install'

export function PwaInstallPrompt({ onInstalled }: { onInstalled: () => void }) {
  const [installing, setInstalling] = useState(false)
  const isIOS = isIOSDevice()

  useEffect(() => {
    if (isStandaloneDisplay()) {
      onInstalled()
      return
    }
    const installedHandler = () => onInstalled()
    window.addEventListener('appinstalled', installedHandler)
    return () => window.removeEventListener('appinstalled', installedHandler)
  }, [onInstalled])

  const handleInstallClick = async () => {
    const prompt = getDeferredInstallPrompt()
    if (prompt) {
      setInstalling(true)
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      setInstalling(false)
      if (outcome === 'accepted') onInstalled()
    } else {
      // iOS or fallback – just dismiss
      onInstalled()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Image src="/logo.png" alt="GainAi" width={40} height={40} className="rounded-lg" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {isIOS ? 'Add to Home Screen' : 'Install GainAi App'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isIOS ? (
                <>
                  Tap the Share button <Share2 className="inline h-4 w-4 mx-1" />
                  and select <span className="font-medium">"Add to Home Screen"</span>
                  <Plus className="inline h-4 w-4 mx-1" />
                </>
              ) : (
                'Install the app for the best experience.'
              )}
            </p>
          </div>
          <Button className="w-full" onClick={handleInstallClick} disabled={installing}>
            <Download className="mr-2 h-4 w-4" />
            {installing ? 'Installing...' : isIOS ? 'Continue' : 'Install App'}
          </Button>
          {isIOS && (
            <p className="text-xs text-muted-foreground">
              After adding to home screen, open the app from your home screen.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
