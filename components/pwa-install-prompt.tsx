'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDeferredInstallPrompt } from '@/lib/pwa-install'

interface PwaInstallPromptProps {
  onInstalled: () => void
  gymName?: string
  gymLogo?: string | null
}

export function PwaInstallPrompt({ onInstalled, gymName, gymLogo }: PwaInstallPromptProps) {
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const installedHandler = () => onInstalled()
    window.addEventListener('appinstalled', installedHandler)
    return () => window.removeEventListener('appinstalled', installedHandler)
  }, [onInstalled])

  async function handleInstallClick() {
    const prompt = getDeferredInstallPrompt()
    if (!prompt) {
      console.warn('No deferred install prompt available – trying to install anyway?')
      return
    }
    setInstalling(true)
    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') onInstalled()
    } catch (err) {
      console.error('Installation error:', err)
    } finally {
      setInstalling(false)
    }
  }

  // Log for debugging
  console.log('[PwaInstallPrompt] Rendering with gymName:', gymName, 'gymLogo:', gymLogo)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            {gymLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gymLogo}
                alt={gymName || 'Gym logo'}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <Image src="/logo.png" alt="GainAi" width={40} height={40} className="rounded-lg" />
            )}
          </div>

          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {gymName ? `Install ${gymName}` : 'One last step'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {gymName
                ? `Install ${gymName} on your home screen to continue.`
                : 'Install GainAi on your home screen to continue.'}
            </p>
          </div>

          <Button className="w-full" onClick={handleInstallClick} disabled={installing}>
            <Download className="mr-2 h-4 w-4" />
            {installing ? 'Installing...' : gymName ? `Install ${gymName}` : 'Install GainAi App'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
