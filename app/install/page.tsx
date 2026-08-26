'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Download, ArrowRight, Smartphone, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useGymBranding } from '@/hooks/use-gym-branding'
import {
  getDeferredInstallPrompt,
  isIOSDevice,
  isStandaloneDisplay,
  onInstallPromptCaptured,  // 🔁 New import
} from '@/lib/pwa-install'

export default function InstallPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [gymId, setGymId] = useState<string | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installing, setInstalling] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  const branding = useGymBranding(gymId)

  // ── Extract gymId ──
  useEffect(() => {
    const fromQuery = searchParams.get('gymId') ?? searchParams.get('gym')
    if (fromQuery) {
      setGymId(fromQuery)
      return
    }

    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      const parts = host.split('.')
      const subdomain = parts[0]
      if (subdomain && !['app', 'panel', 'www'].includes(subdomain)) {
        setGymId(subdomain)
      }
    }
  }, [searchParams])

  // ── Detect iOS ──
  useEffect(() => {
    setIsIOS(isIOSDevice())
  }, [])

  // ── Check if already installed ──
  useEffect(() => {
    if (gymId && isStandaloneDisplay()) {
      router.replace('https://app.gainai.space/dashboard')
    }
  }, [gymId, router])

  // ── 🔁 Listen for beforeinstallprompt (reactive) ──
  useEffect(() => {
    // Check if already available
    const existingPrompt = getDeferredInstallPrompt()
    if (existingPrompt) {
      setDeferredPrompt(existingPrompt)
      return
    }

    // Subscribe to future capture
    const unsubscribe = onInstallPromptCaptured(() => {
      const prompt = getDeferredInstallPrompt()
      if (prompt) setDeferredPrompt(prompt)
    })

    return () => unsubscribe()
  }, [])

  // ── Handle install ──
  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setInstalling(false)
    if (outcome === 'accepted') {
      // appinstalled event will redirect
    }
  }

  // ── Skip to web app ──
  const handleSkip = () => {
    if (gymId) {
      localStorage.setItem('gainai_pending_gym_id', gymId)
      document.cookie = `gainai_pending_gym_id=${encodeURIComponent(gymId)}; path=/; domain=.gainai.space; max-age=31536000; samesite=lax`
    }
    router.replace('https://app.gainai.space/dashboard')
  }

  // ── Loading ──
  if (!gymId || !branding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-[#00ff88] border-t-transparent animate-spin" />
      </div>
    )
  }

  const logoUrl = branding.logo_url
  const gymName = branding.gym_name || 'Gym'
  const brandColor = branding.brand_color || '#00ff88'

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardContent className="p-8 flex flex-col items-center text-center gap-6">
          {/* Gym Logo */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 overflow-hidden border-2 border-border/50 shadow-lg" style={{ borderColor: `${brandColor}40` }}>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${gymName} logo`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: brandColor }}>
                <Zap className="h-10 w-10 text-white" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">{gymName}</h1>
            <p className="text-sm text-muted-foreground mt-1">Get the app for the best experience.</p>
          </div>

          {/* Phone Mockup */}
          <div className="relative w-full max-w-[200px] aspect-[9/19] rounded-3xl border-4 border-foreground/10 bg-muted/30 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background/80 to-background/50">
              <Smartphone className="h-10 w-10 text-primary opacity-40" />
              <p className="text-xs text-muted-foreground mt-2 opacity-60">Your app is ready</p>
            </div>
          </div>

          {/* Install Button or iOS instructions */}
          {!isIOS && deferredPrompt ? (
            <Button
              onClick={handleInstall}
              disabled={installing}
              className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold hover:shadow-lg hover:shadow-[#00ff88]/30 transition-all text-base py-6 h-14"
            >
              <Download className="mr-2 h-5 w-5" />
              {installing ? 'Installing...' : 'Install App'}
            </Button>
          ) : isIOS ? (
            <div className="w-full space-y-3">
              <div className="rounded-lg bg-muted/30 p-4 text-left text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Install on iOS:</p>
                <ol className="mt-2 list-decimal list-inside space-y-1 text-xs">
                  <li>Tap the Share button <span className="inline-block mx-1">📤</span></li>
                  <li>Select <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>"Add"</strong> to install</li>
                </ol>
              </div>
              <Button
                onClick={handleSkip}
                variant="outline"
                className="w-full"
              >
                Continue to Web App <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSkip}
              className="w-full"
            >
              Continue to Web App <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            {!isIOS && deferredPrompt
              ? 'Install now to get the best experience on your home screen.'
              : 'Use the web app directly, or install for offline access.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
