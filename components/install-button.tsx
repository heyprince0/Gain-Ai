'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface InstallButtonProps {
  slug: string
  accentColor: string
}

export function InstallButton({ slug, accentColor }: InstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    setIsIos(/iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window))

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  if (isIos) {
    return (
      <p className="max-w-xs text-center text-sm leading-6 text-muted-foreground">
        Tap the Share icon, then &apos;Add to Home Screen&apos;.
      </p>
    )
  }

  if (!installPrompt) {
    return (
      <p className="text-center text-sm leading-6 text-muted-foreground">
        Open this page in your browser to install the app.
      </p>
    )
  }

  return (
    <Button
      type="button"
      onClick={() => installPrompt.prompt()}
      className="min-w-44 rounded-full px-7 py-6 text-sm font-semibold text-background shadow-lg transition-transform hover:-translate-y-0.5"
      style={{ backgroundColor: accentColor }}
      aria-label={`Install ${slug} app`}
    >
      Install App
    </Button>
  )
}

export default InstallButton
