'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, ArrowRight, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDeferredInstallPrompt, isIOSDevice, isStandaloneDisplay, onInstallPromptCaptured } from '@/lib/pwa-install'

export default function InstallPage() {
  const router = useRouter()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installing, setInstalling] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [installSupported, setInstallSupported] = useState<boolean | null>(null)

  useEffect(() => {
    setIsIOS(isIOSDevice())
    if (isStandaloneDisplay()) router.replace('/dashboard')
  }, [router])

  useEffect(() => {
    if (isIOS) {
      setInstallSupported(false)
      return
    }
    let attempts = 0
    const interval = setInterval(() => {
      attempts += 1
      const prompt = getDeferredInstallPrompt()
      if (prompt || attempts >= 10) {
        setDeferredPrompt(prompt)
        setInstallSupported(Boolean(prompt))
        clearInterval(interval)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [isIOS])

  useEffect(() => {
    const unsubscribe = onInstallPromptCaptured(() => {
      const prompt = getDeferredInstallPrompt()
      if (prompt) {
        setDeferredPrompt(prompt)
        setInstallSupported(true)
      }
    })
    return () => { unsubscribe() }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
    } finally {
      setInstalling(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <span className="grid size-20 place-items-center rounded-2xl bg-primary/10 text-primary"><Smartphone className="size-9" /></span>
          <div><p className="text-sm font-semibold text-primary">GainAI</p><h1 className="mt-2 text-2xl font-bold">Take your fitness journey with you.</h1><p className="mt-2 text-sm text-muted-foreground">Install GainAI for quick access to your workouts, food scanner, and progress.</p></div>
          {installSupported === true && !isIOS ? (
            <Button onClick={handleInstall} disabled={installing} className="w-full"><Download className="mr-2 size-4" />{installing ? 'Installing…' : 'Install app'}</Button>
          ) : installSupported === null ? (
            <Button disabled className="w-full">Checking installation options…</Button>
          ) : (
            <Button onClick={() => router.replace('/dashboard')} variant="outline" className="w-full">Continue to GainAI <ArrowRight className="ml-2 size-4" /></Button>
          )}
          {isIOS && <p className="text-xs text-muted-foreground">Tap Share in your browser, then choose Add to Home Screen.</p>}
        </CardContent>
      </Card>
    </main>
  )
}
