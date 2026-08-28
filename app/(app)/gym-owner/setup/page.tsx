'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser' // ← CHANGED

export default function GymSetup() {
  const router = useRouter()
  const [form, setForm] = useState({
    gym_name: '',
    owner_name: '',
    owner_phone: '',
    address: '',
    city_area: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/gym-owner/login')
        return
      }

      const { error: insertError } = await supabase.from('gyms').insert({
        gym_name: form.gym_name,
        owner_name: form.owner_name,
        owner_phone: form.owner_phone,
        address: form.address,
        city_area: form.city_area,
        owner_id: user.id,
      })

      if (insertError) {
        console.error('[v0] Gym setup insert failed:', insertError)
        setError('We could not save your gym details. Please check the form and try again.')
        return
      }

      router.replace('/gym-owner/dashboard')
    } catch (err) {
      console.error('[v0] Unexpected gym setup error:', err)
      setError('Something went wrong while setting up your gym. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Building2 />
          </div>
          <CardTitle className="pt-4 text-2xl">Set up your gym</CardTitle>
          <CardDescription>
            Tell us a few details so your owner workspace is ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {([
              ['gym_name', 'Gym name', true],
              ['owner_name', 'Your name', true],
              ['owner_phone', 'Phone number', true],
              ['address', 'Address', true],
              ['city_area', 'City / area', false],
            ] as const).map(([key, label, required]) => (
              <div className="flex flex-col gap-2" key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  required={required as boolean}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => update(key, e.target.value)}
                />
              </div>
            ))}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button disabled={busy} className="mt-2">
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              Continue to dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
