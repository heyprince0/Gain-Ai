'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDeferredInstallPrompt } from '@/lib/pwa-install'
import { useGymBranding } from '@/lib/use-gym-branding'
import { useAuth } from '@/lib/auth-context'

export function PwaInstallPrompt({ onInstalled }: { onInstalled: () => void }) {
  const { user } = useAuth()
  const [installing, setInstalling] = useState(false)

  // ✅ Fetch gym branding from the user's gym_id
  const branding = useGymBranding(user?.id ? undefined : undefined) // This hook needs a gym_id; we need to fetch the user's gym_id first

  // Since useGymBranding expects a gym_id, we need to fetch the user's profile first
  // But we can also make a separate query here. Let's fetch the gym_id ourselves.
  const [gymId, setGymId] = useState<string | null>(null)
  const [brandingData, setBrandingData] = useState<{ logo_url?: string; gym_name?: string } | null>(null)

  useEffect(() => {
    if (!user) return
    // Fetch the user's gym_id from profiles
    supabase
      .from('profiles')
      .select('gym_id')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.gym_id) {
          setGymId(data.gym_id)
        }
      })
  }, [user])

  // Now fetch branding using the gym_id
  useEffect(() => {
    if (!gymId) return
    supabase
      .from('gym_branding')
      .select('logo_url, gym_name')
      .eq('gym_id', gymId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBrandingData(data)
        }
      })
  }, [gymId])

  useEffect(() => {
    const installedHandler = () => onInstalled()
    window.addEventListener('appinstalled', installedHandler)
    return () => window.removeEventListener('appinstalled', installedHandler)
  }, [onInstalled])

  async function handleInstallClick() {
    const prompt = getDeferredInstallPrompt()
    if (!prompt) return
    setInstalling(true)
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    setInstalling(false)
    if (outcome === 'accepted') onInstalled()
  }

  // Use branding if available, else fallback to GainAi
  const appName = brandingData?.gym_name || 'GainAi'
  const logoUrl = brandingData?.logo_url || '/logo.png'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={appName} className="size-12 rounded-lg object-cover" />
            ) : (
              <Image src="/logo.png" alt="GainAi" width={40} height={40} className="rounded-lg" />
            )}
          </div>

          <div>
            <h1 className="text-xl font-semibold text-foreground">One last step</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Install {appName} on your home screen to continue.
            </p>
          </div>

          <Button className="w-full" onClick={handleInstallClick} disabled={installing}>
            <Download data-icon="inline-start" />
            {installing ? 'Installing...' : `Install ${appName}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
