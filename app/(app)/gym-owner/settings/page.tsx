'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Plus, Trash2, Save, Building, Palette, QrCode, Smartphone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { GymOwnerShell } from '@/components/gym-owner-shell'
import { getOwnerData, type Gym, type Plan } from '@/lib/gym-owner'
import { supabase } from '@/lib/supabase'
import { GymAttendanceQr } from '@/components/gym-attendance-qr'
import { GymInstallQr } from '@/components/gym-install-qr'
import { AppearanceCard } from '@/components/appearance-card'
import { BrandingCard } from '@/components/branding-card'

export default function SettingsPage() {
  const [gym, setGym] = useState<Gym | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [form, setForm] = useState({ plan_name: '', price: '', duration_days: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Brand editing state
  const [gymName, setGymName] = useState('')
  const [savingBrand, setSavingBrand] = useState(false)
  const [brandSuccess, setBrandSuccess] = useState(false)

  const load = () =>
    supabase.auth.getUser().then(({ data }) =>
      data.user &&
      getOwnerData(data.user.id).then(({ gym, plans }) => {
        setGym(gym)
        if (gym) setGymName(gym.gym_name)
        setPlans(plans.filter((p) => p.is_active !== false))
      })
    )

  useEffect(() => {
    void load()
  }, [])

  async function updateBrand(e: FormEvent) {
    e.preventDefault()
    if (!gym || !gymName.trim()) return
    setSavingBrand(true)
    setBrandSuccess(false)
    const { error: updateError } = await supabase
      .from('gyms')
      .update({ gym_name: gymName.trim() })
      .eq('id', gym.id)

    if (updateError) {
      setError(updateError.message)
      setSavingBrand(false)
      return
    }
    // Update local gym state
    setGym({ ...gym, gym_name: gymName.trim() })
    setBrandSuccess(true)
    setSavingBrand(false)
    setTimeout(() => setBrandSuccess(false), 3000)
  }

  async function addPlan(e: FormEvent) {
    e.preventDefault()
    if (!gym) {
      setError('Your gym workspace is still loading. Please try again.')
      return
    }
    const price = Number(form.price)
    const durationDays = Number(form.duration_days)
    if (!form.plan_name.trim() || !Number.isFinite(price) || price < 0 || !Number.isInteger(durationDays) || durationDays < 1) {
      setError('Enter a plan name, a valid non-negative price, and a whole-number duration.')
      return
    }
    setBusy(true)
    setError('')

    const { error: insertError } = await supabase
      .from('gym_subscription_plans')
      .insert({
        gym_id: gym.id,
        plan_name: form.plan_name,
        price,
        duration_days: durationDays,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      setError(insertError.message)
      setBusy(false)
      return
    }

    setForm({ plan_name: '', price: '', duration_days: '' })
    await load()
    setBusy(false)
  }

  async function confirmDelete() {
    if (!planToDelete) return
    setDeleting(true)
    setError('')

    const { error: updateError } = await supabase
      .from('gym_subscription_plans')
      .update({ is_active: false })
      .eq('id', planToDelete.id)

    setDeleting(false)

    if (updateError) {
      console.error('Delete error:', updateError)
      setError('Could not delete this plan. Please try again.')
      return
    }

    setPlanToDelete(null)
    await load()
  }

  return (
    <GymOwnerShell title="Settings">
      <div className="space-y-8">
        {/* ====== BRAND SECTION ====== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="size-5 text-primary" />
              Gym Brand
            </CardTitle>
            <CardDescription>
              Update your gym’s name — this appears in the app header and install pages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateBrand} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="gymName">Gym name</Label>
                <Input
                  id="gymName"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  placeholder="Your gym name"
                  className="max-w-md"
                />
              </div>
              <Button
                type="submit"
                disabled={savingBrand || !gymName.trim() || gymName === gym?.gym_name}
                className="shrink-0"
              >
                {savingBrand ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {savingBrand ? 'Saving...' : 'Save brand'}
              </Button>
            </form>
            {brandSuccess && (
              <p className="mt-3 text-sm text-green-600 dark:text-green-400">
                ✅ Brand name updated successfully!
              </p>
            )}
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {/* ====== SUBSCRIPTION PLANS ====== */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subscription plans</CardTitle>
                <CardDescription>Plans you can assign to new members.</CardDescription>
              </div>
              <Plus className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              {plans.map((p) => (
                <div className="flex items-center justify-between rounded-xl border p-4" key={p.id}>
                  <div>
                    <p className="font-medium">{p.plan_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{p.price} · {p.duration_days} days
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setPlanToDelete(p)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {plans.length === 0 && (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No plans yet. Create your first one below.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <form onSubmit={addPlan} className="grid gap-3 border-t pt-5 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>Plan name</Label>
                <Input
                  required
                  value={form.plan_name}
                  onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Price (₹)</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Duration (days)</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                />
              </div>
              <Button className="md:col-span-3" disabled={busy}>
                {busy ? 'Adding...' : <><Plus className="mr-2 size-4" />New plan</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ====== QR CODES & BRANDING ====== */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="size-5 text-primary" />
                  Attendance QR
                </CardTitle>
                <CardDescription>Print and place at your gym entrance.</CardDescription>
              </CardHeader>
              <CardContent>
                {gym ? (
                  <GymAttendanceQr gymId={gym.id} gymName={gym.gym_name} />
                ) : (
                  <p className="text-center text-sm text-muted-foreground">Loading...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="size-5 text-primary" />
                  Install App QR
                </CardTitle>
                <CardDescription>New members scan to install the app for your gym.</CardDescription>
              </CardHeader>
              <CardContent>
                {gym ? (
                  <GymInstallQr slug={gym.slug} gymName={gym.gym_name} />
                ) : (
                  <p className="text-center text-sm text-muted-foreground">Loading...</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <AppearanceCard />
            {gym && <BrandingCard gymId={gym.id} />}
          </div>
        </div>
      </div>

      {/* Delete plan confirmation dialog */}
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              "{planToDelete?.plan_name}" will no longer be offered to new members. Members currently
              on this plan keep their existing dates and details — nothing changes for them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete plan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GymOwnerShell>
  )
}
