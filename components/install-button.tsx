'use client'

import { useEffect, useState } from 'react'
import { Check, Download, ExternalLink, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>
}

interface InstallButtonProps {
  gymName: string
  slug: string
  accentColor: string
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
}

export function InstallButton({ gymName, slug, accentColor }: InstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'standalone'>('desktop')
  const [installed, setInstalled] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    setPlatform(isStandalone() ? 'standalone' : ios ? 'ios' : /android/.test(userAgent) ? 'android' : 'desktop')

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
      setInstalling(false)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  async function install() {
    if (!installPrompt || installing) return
    setInstalling(true)
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)
    setInstalling(false)
    if (choice.outcome === 'accepted') setInstalled(true)
    else setDismissed(true)
  }

  if (installed || platform === 'standalone') {
    return <div className="flex flex-col items-center gap-3 text-center"><p className="flex items-center gap-2 text-sm text-white/70"><Check className="size-4" style={{ color: accentColor }} /> You&apos;re already using the installed {gymName} app.</p><Button asChild variant="outline" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"><a href="https://app.gainai.space/dashboard"><ExternalLink data-icon="inline-start" />Continue to app</a></Button></div>
  }
  if (platform === 'ios') {
    return <div className="flex max-w-sm flex-col items-center gap-3 text-center text-sm leading-6 text-white/70"><p className="font-semibold text-white">Install {gymName} App</p><ol className="list-inside list-decimal text-left"><li>Tap the Share button in Safari.</li><li>Select <strong className="text-white">Add to Home Screen</strong>.</li><li>Tap <strong className="text-white">Add</strong>.</li></ol><Share2 className="size-5" style={{ color: accentColor }} /></div>
  }
  if (installPrompt && !dismissed) {
    return <Button type="button" onClick={install} disabled={installing} className="min-w-48 rounded-full px-7 py-6 text-sm font-semibold text-background shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: accentColor }} aria-label={`Install ${gymName} app`}><Download data-icon="inline-start" />{installing ? 'Installing...' : `Install ${gymName} App`}</Button>
  }
  return <p className="max-w-xs text-center text-sm leading-6 text-white/65">Open this page on your phone to install the {gymName} app. Use your browser&apos;s menu to add it to your home screen.</p>
}

export default InstallButton

export function GymAppLink({ slug }: { slug: string }) {
  return <a className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline" href={`/g/${encodeURIComponent(slug)}`}><ExternalLink data-icon="inline-start" />Open gym app</a>
}
