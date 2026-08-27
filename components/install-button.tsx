'use client'

import { useEffect, useState } from 'react'
import { Check, Download, ExternalLink, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface InstallButtonProps {
  slug: string
  accentColor: string
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
}

export function InstallButton({ slug, accentColor }: InstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'standalone'>('desktop')
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window)
    setPlatform(isStandalone() ? 'standalone' : ios ? 'ios' : /android/.test(userAgent) ? 'android' : 'desktop')

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  async function install() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    else setDismissed(true)
    setInstallPrompt(null)
  }

  if (installed || platform === 'standalone') {
    return <p className="flex items-center gap-2 text-sm text-white/70"><Check className="size-4" style={{ color: accentColor }} /> This gym app is installed on this device.</p>
  }
  if (platform === 'ios') {
    return <p className="max-w-xs text-center text-sm leading-6 text-white/65"><Share2 className="mx-auto mb-2 size-5" style={{ color: accentColor }} />Tap the Share icon, then choose <strong className="text-white">Add to Home Screen</strong>.</p>
  }
  if (installPrompt && !dismissed) {
    return <Button type="button" onClick={install} className="min-w-44 rounded-full px-7 py-6 text-sm font-semibold text-background shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: accentColor }} aria-label={`Install ${slug} app`}><Download data-icon="inline-start" />Install app</Button>
  }
  return <p className="max-w-xs text-center text-sm leading-6 text-white/65">Use your browser&apos;s menu to install this app, or open the page on your phone to add it to your home screen.</p>
}

export default InstallButton

export function GymAppLink({ slug }: { slug: string }) {
  return <a className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline" href={`/g/${slug}`}><ExternalLink className="size-4" />Open gym app</a>
}
