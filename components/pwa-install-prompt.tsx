'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDeferredInstallPrompt } from '@/lib/pwa-install'

export function PwaInstallPrompt({ onInstalled }: { onInstalled: () => void }) {
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // The browser's real signal that installation actually completed —
    // this is what lets the screen go away, not a dismiss button.
    const installedHandler = () => onInstalled()
    window.addEventListener('appinstalled', installedHandler)
    return () => window.removeEventListener('appinstalled', installedHandler)
  }, [onInstalled])

  async function handleInstallClick() {
    const prompt = getDeferredInstallPrompt()
    if (!prompt) return // shouldn't happen — this screen only renders when installable
    setInstalling(true)
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    setInstalling(false)
    if (outcome === 'accepted') onInstalled()
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

          <Button className="w-full" onClick={handleInstallClick} disabled={installing}>
            <Download data-icon="inline-start" />
            {installing ? 'Installing...' : 'Install GainAi App'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
