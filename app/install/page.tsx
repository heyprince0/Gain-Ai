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
  onInstallPromptCaptured,
} from '@/lib/pwa-install'

export default function InstallPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [gymId, setGymId] = useState<string | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installing, setInstalling] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [promptAvailable, setPromptAvailable] = useState<boolean | null>(null)

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

  // ── If already installed, skip ──
  useEffect(() => {
    if (gymId && isStandaloneDisplay()) {
      router.replace('https://app.gainai.space/dashboard')
    }
  }, [gymId, router])

  // ── 🔁 Listen for beforeinstallprompt ──
  useEffect(() => {
    // Check if already available
    const existingPrompt = getDeferredInstallPrompt()
    if (existingPrompt) {
      setDeferredPrompt(existingPrompt)
      setPromptAvailable(true)
      return
    }

    // Subscribe to future capture
    const unsubscribe = onInstallPromptCaptured(() => {
      const prompt = getDeferredInstallPrompt()
      if (prompt) {
        setDeferredPrompt(prompt)
        setPromptAvailable(true)
      }
    })

    // Timeout fallback: if no prompt after 5 seconds, mark as unavailable
    const timeout = setTimeout(() => {
      if (!getDeferredInstallPrompt()) {
        setPromptAvailable(false)
      }
    }, 5000)

    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
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
  const handleContinue = () => {
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

  // ── Show install button if prompt is available ──
  const showInstall = promptAvailable === true && !isIOS
  const showFallback = promptAvailable === false || isIOS

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
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: brandColor }}>
                <Zap className="h-10 w-10 text-white" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">{gymName}</h1>
            <p className="text-sm text-muted-foreground mt-1">Download the app for the best experience.</p>
          </div>

          {/* Phone Mockup */}
          <div className="relative w-full max-w-[200px] aspect-[9/19] rounded-3xl border-4 border-foreground/10 bg-muted/30 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background/80 to-background/50">
              <Smartphone className="h-10 w-10 text-primary opacity-40" />
              <p className="text-xs text-muted-foreground mt-2 opacity-60">Download the app</p>
            </div>
          </div>

          {/* ─── Install Button (Primary) ─── */}
          {showInstall ? (
            <Button
              onClick={handleInstall}
              disabled={installing}
              className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold hover:shadow-lg hover:shadow-[#00ff88]/30 transition-all text-base py-6 h-14 text-lg"
            >
              <Download className="mr-2 h-5 w-5" />
              {installing ? 'Installing...' : 'Install App'}
            </Button>
          ) : (
            // ─── Fallback: Continue Button ───
            <Button
              onClick={handleContinue}
              variant="outline"
              className="w-full"
            >
              Continue to Web App <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            {showInstall
              ? 'Install now to get the best experience on your home screen.'
              : 'Use the web app directly, or install for offline access.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
