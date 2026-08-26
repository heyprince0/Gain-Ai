'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download, Share2, Plus, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDeferredInstallPrompt, consumeDeferredInstallPrompt, isIOSDevice, isStandaloneDisplay } from '@/lib/pwa-install'
import { useGymBranding } from '@/lib/use-gym-branding'

export function PwaInstallPrompt({ onInstalled }: { onInstalled: () => void }) {
  const [installing, setInstalling] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const branding = useGymBranding()
  const gymName = branding?.gym_name || 'GainAi'
  const logoUrl = branding?.logo_url || '/logo.png'

  useEffect(() => {
    setIsIOS(isIOSDevice())
    if (isStandaloneDisplay()) onInstalled()
    const installedHandler = () => onInstalled()
    window.addEventListener('appinstalled', installedHandler)
    return () => window.removeEventListener('appinstalled', installedHandler)
  }, [onInstalled])

  const handleInstallClick = async () => {
    const prompt = getDeferredInstallPrompt()
    if (!prompt) {
      onInstalled()
      return
    }

    setInstalling(true)
    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      consumeDeferredInstallPrompt()
      if (outcome === 'accepted') onInstalled()
    } finally {
      setInstalling(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md overflow-hidden border-border/60 shadow-xl">
        <div className="h-1 bg-[#00ff88]" />
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center sm:p-10">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-muted ring-1 ring-border">
            {!logoFailed ? (
              <Image src={logoUrl} alt={`${gymName} logo`} width={56} height={56} className="size-14 rounded-2xl object-cover" onError={() => setLogoFailed(true)} unoptimized />
            ) : <Dumbbell className="size-10 text-[#00ff88]" aria-hidden="true" />}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#00ff88]">{gymName}</p>
            <h1 className="text-balance text-2xl font-semibold text-foreground">
              {isIOS ? 'Add your member app' : `Install ${gymName}`}
            </h1>
            <p className="text-pretty text-sm leading-6 text-muted-foreground">
              {isIOS ? <>Tap the Share button <Share2 className="mx-1 inline size-4" aria-hidden="true" /> then choose <span className="font-medium text-foreground">Add to Home Screen</span> <Plus className="mx-1 inline size-4" aria-hidden="true" />.</> : 'Keep your gym tools one tap away with the fastest app experience.'}
            </p>
          </div>
          <Button className="w-full" onClick={handleInstallClick} disabled={installing}>
            <Download className="mr-2 size-4" aria-hidden="true" />
            {installing ? 'Installing…' : isIOS ? 'Got it' : 'Install app'}
          </Button>
          {isIOS && <p className="text-xs leading-5 text-muted-foreground">After adding it, open GainAi from your home screen.</p>}
        </CardContent>
      </Card>
    </main>
  )
}
