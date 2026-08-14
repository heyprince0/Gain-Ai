'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Plus, Trash2, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GymOwnerShell } from '@/components/gym-owner-shell'
import { getOwnerData, type Gym, type Plan } from '@/lib/gym-owner'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const [gym, setGym] = useState<Gym | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [form, setForm] = useState({ plan_name: '', price: '', duration_days: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = () =>
    supabase.auth.getUser().then(({ data }) =>
      data.user &&
      getOwnerData(data.user.id).then(({ gym, plans }) => {
        setGym(gym)
        setPlans(plans)
      })
    )

  useEffect(() => {
    void load()
  }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!gym) return
    setBusy(true)
    setError('')

    const { error: insertError } = await supabase
      .from('gym_subscription_plans')  // ✅ correct table name
      .insert({
        gym_id: gym.id,
        plan_name: form.plan_name,     // ✅ correct column name
        price: Number(form.price),
        duration_days: Number(form.duration_days),
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

  async function remove(id: string) {
    const { error } = await supabase
      .from('gym_subscription_plans')
      .delete()
      .eq('id', id)
    if (error) console.error('Delete error:', error)
    else await load()
  }

  return (
    <GymOwnerShell title="Settings">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
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
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 />
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

            <form onSubmit={add} className="grid gap-3 border-t pt-5 md:grid-cols-3">
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

        <Card>
          <CardHeader>
            <CardTitle>Attendance QR code</CardTitle>
            <CardDescription>Print this and place it at your gym entrance.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 text-center">
            <div className="flex size-52 items-center justify-center rounded-2xl border-4 border-foreground bg-background">
              <QrCode className="size-36" strokeWidth={1.2} />
            </div>
            <p className="text-sm text-muted-foreground">
              Members scan this QR code in the GainAi app to log attendance.
            </p>
            <Button variant="outline" onClick={() => window.print()}>
              Download QR code
            </Button>
          </CardContent>
        </Card>
      </div>
    </GymOwnerShell>
  )
}
