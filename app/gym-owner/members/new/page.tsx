'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GymOwnerShell } from '@/components/gym-owner-shell'
import { addDays, getOwnerData, type Gym, type Plan } from '@/lib/gym-owner'
import { supabase } from '@/lib/supabase'

export default function NewMember() {
  const router = useRouter()
  const [gym, setGym] = useState<Gym | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [planId, setPlanId] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    start_date: new Date().toISOString().slice(0, 10),
  })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) =>
      data.user &&
      getOwnerData(data.user.id).then(({ gym, plans }) => {
        setGym(gym)
        setPlans(plans)
      })
    )
  }, [])

  const plan = plans.find((p) => p.id === planId)
  const end = plan ? addDays(form.start_date, plan.duration_days) : ''

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!gym) return
    setBusy(true)

    const { error } = await supabase.from('gym_members').insert({
      ...form,
      gym_id: gym.id,
      plan_id: planId || null,
      end_date: end,
      app_access: true, // members get app access enabled by default
    })

    if (!error) router.replace('/gym-owner/dashboard')
    setBusy(false)
  }

  return (
    <GymOwnerShell title="Add member">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/gym-owner/dashboard"
          className="mb-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to members
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Add a new member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Name</Label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Phone number</Label>
                  <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Address</Label>
                <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Subscription plan</Label>
                  <Select value={planId} onValueChange={setPlanId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem value={p.id} key={p.id}>
                          {p.plan_name} — ₹{p.price} — {p.duration_days} days
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>End date</Label>
                <Input
                  readOnly
                  value={end ? new Date(`${end}T00:00:00`).toLocaleDateString('en-IN') : 'Select a plan to calculate'}
                />
              </div>

              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                App access starts on. You can turn it off from the member profile if needed.
              </p>

              <Button disabled={busy || !planId}>
                {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
                Save member
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </GymOwnerShell>
  )
}
