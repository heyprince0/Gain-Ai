'use client'

import { useEffect, useState } from 'react'
import { Check, Download, ExternalLink, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname, useRouter } from 'next/navigation'

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
  const pathname = usePathname()
  const router = useRouter()

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

  // 🎯 The dashboard is now the target
  const targetPath = '/dashboard'

  // If we're already on the dashboard, show nothing (let the dashboard render)
  if (pathname === targetPath) {
    return null
  }

  // If the app is installed or running standalone, show "Continue" button
  if (installed || platform === 'standalone') {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="flex items-center gap-2 text-sm text-white/70">
          <Check className="size-4" style={{ color: accentColor }} />
          App installed! Continue to your dashboard.
        </p>
        <Button
          variant="outline"
          className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
          onClick={() => router.push(targetPath)}
        >
          <ExternalLink data-icon="inline-start" />
          Continue to app
        </Button>
      </div>
    )
  }

  // iOS installation instructions
  if (platform === 'ios') {
    return (
      <div className="flex max-w-sm flex-col items-center gap-3 text-center text-sm leading-6 text-white/70">
        <p className="font-semibold text-white">Install {gymName} App</p>
        <ol className="list-inside list-decimal text-left">
          <li>Tap the Share button in Safari.</li>
          <li>Select <strong className="text-white">Add to Home Screen</strong>.</li>
          <li>Tap <strong className="text-white">Add</strong>.</li>
        </ol>
        <Share2 className="size-5" style={{ color: accentColor }} />
      </div>
    )
  }

  // Android / Desktop install prompt
  if (installPrompt && !dismissed) {
    return (
      <Button
        type="button"
        onClick={install}
        disabled={installing}
        className="min-w-48 rounded-full px-7 py-6 text-sm font-semibold text-background shadow-lg transition-transform hover:-translate-y-0.5"
        // 🔽 Only change here
        style={{ backgroundColor: '#000000', color: '#ffffff' }}
        aria-label={`Install ${gymName} app`}
      >
        <Download data-icon="inline-start" />
        {installing ? 'Installing...' : `Install ${gymName} App`}
      </Button>
    )
  }

  return (
    <p className="max-w-xs text-center text-sm leading-6 text-white/65">
      Open this page on your phone to install the {gymName} app. Use your browser&apos;s menu to add it to
      your home screen.
    </p>
  )
}

export default InstallButton

// 🆕 GymAppLink component fixed to go to dashboard
export function GymAppLink({ slug }: { slug: string }) {
  const pathname = usePathname()
  const targetPath = '/dashboard'

  if (pathname === targetPath) return null

  return (
    <a
      className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
      href={targetPath}
    >
      <ExternalLink data-icon="inline-start" />
      Open gym app
    </a>
  )
}
