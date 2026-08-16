'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, CalendarClock, CheckCircle2, Clock, Phone, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { GymOwnerShell } from '@/components/gym-owner-shell'
import {
  addDays, daysUntilEnd, formatDate, getOwnerData,
  type Gym, type GymMember, type Plan,
} from '@/lib/gym-owner'
import { supabase } from '@/lib/supabase'

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

export default function RenewalsPage() {
  const [gym, setGym] = useState<Gym | null>(null)
  const [members, setMembers] = useState<GymMember[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [renewing, setRenewing] = useState<GymMember | null>(null)

  const load = () =>
    supabase.auth.getUser().then(({ data }) =>
      data.user &&
      getOwnerData(data.user.id).then(({ gym, members, plans }) => {
        setGym(gym)
        setMembers(members)
        setPlans(plans.filter((p) => p.is_active !== false))
        setLoading(false)
      })
    )

  useEffect(() => {
    void load()
  }, [])

  const { expired, today, thisWeek } = useMemo(() => {
    const expired: GymMember[] = []
    const today: GymMember[] = []
    const thisWeek: GymMember[] = []
    for (const m of members) {
      const days = daysUntilEnd(m.end_date)
      if (days < 0) expired.push(m)
      else if (days === 0) today.push(m)
      else if (days <= 7) thisWeek.push(m)
    }
    expired.sort((a, b) => daysUntilEnd(a.end_date) - daysUntilEnd(b.end_date)) // most overdue first
    thisWeek.sort((a, b) => daysUntilEnd(a.end_date) - daysUntilEnd(b.end_date)) // soonest first
    return { expired, today, thisWeek }
  }, [members])

  const totalNeedingAttention = expired.length + today.length + thisWeek.length

  async function handleRenewed() {
    setRenewing(null)
    await load()
  }

  return (
    <GymOwnerShell title="Renewals">
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Renewals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Memberships that are expired, expiring today, or expiring this week.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={AlertTriangle} label="Expired" value={expired.length} tone="red" />
          <StatCard icon={Clock} label="Expiring today" value={today.length} tone="amber" />
          <StatCard icon={CalendarClock} label="Expiring this week" value={thisWeek.length} tone="yellow" />
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading renewals...</p>
        ) : totalNeedingAttention === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <CheckCircle2 className="size-10 text-green-500" />
              <h3 className="font-medium">All caught up</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                No memberships need attention right now. New alerts will show up here as plans approach their end date.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {expired.length > 0 && (
              <RenewalSection
                title="Expired"
                description="These members' access has already lapsed. Renew to restore their membership."
                tone="red"
                members={expired}
                onRenew={setRenewing}
              />
            )}
            {today.length > 0 && (
              <RenewalSection
                title="Expiring today"
                description="Last day of their current plan — renew now to avoid a gap."
                tone="amber"
                members={today}
                onRenew={setRenewing}
              />
            )}
            {thisWeek.length > 0 && (
              <RenewalSection
                title="Expiring this week"
                description="Coming up in the next 7 days."
                tone="yellow"
                members={thisWeek}
                onRenew={setRenewing}
              />
            )}
          </div>
        )}
      </div>

      {renewing && (
        <RenewDialog
          member={renewing}
          plans={plans}
          open={!!renewing}
          onOpenChange={(open) => !open && setRenewing(null)}
          onRenewed={handleRenewed}
        />
      )}
    </GymOwnerShell>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof AlertTriangle
  label: string
  value: number
  tone: 'red' | 'amber' | 'yellow'
}) {
  const toneClasses = {
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    amber: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  }[tone]

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex size-10 items-center justify-center rounded-xl ${toneClasses}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function RenewalSection({
  title,
  description,
  tone,
  members,
  onRenew,
}: {
  title: string
  description: string
  tone: 'red' | 'amber' | 'yellow'
  members: GymMember[]
  onRenew: (m: GymMember) => void
}) {
  const dotClass = {
    red: 'bg-red-500',
    amber: 'bg-orange-500',
    yellow: 'bg-yellow-500',
  }[tone]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${dotClass}`} />
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary">{members.length}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {members.map((m) => {
          const days = daysUntilEnd(m.end_date)
          const dayLabel =
            days < 0 ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
            : days === 0 ? 'Expires today'
            : `in ${days} day${days === 1 ? '' : 's'}`

          return (
            <div key={m.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {initials(m.name)}
                </div>
                <div>
                  <Link href={`/gym-owner/members/${m.id}`} className="font-medium hover:underline">
                    {m.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" />
                      {m.phone}
                    </span>
                    <span>{m.gym_subscription_plans?.plan_name ?? 'No plan'}</span>
                    <span>Ended {formatDate(m.end_date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:ml-auto">
                <Badge
                  variant="outline"
                  className={
                    days < 0
                      ? 'border-transparent bg-red-500/15 text-red-600 dark:text-red-400'
                      : days === 0
                      ? 'border-transparent bg-orange-500/15 text-orange-600 dark:text-orange-400'
                      : 'border-transparent bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                  }
                >
                  {dayLabel}
                </Badge>
                <Button size="sm" onClick={() => onRenew(m)}>
                  <RefreshCw data-icon="inline-start" />
                  Renew
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function RenewDialog({
  member,
  plans,
  open,
  onOpenChange,
  onRenewed,
}: {
  member: GymMember
  plans: Plan[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onRenewed: () => void
}) {
  const defaultStart = daysUntilEnd(member.end_date) < 0
    ? new Date().toISOString().slice(0, 10) // lapsed — restart from today
    : addDays(member.end_date, 1) // still active — continue seamlessly

  const [planId, setPlanId] = useState(member.plan_id ?? '')
  const [startDate, setStartDate] = useState(defaultStart)
  const [busy, setBusy] = useState(false)

  const plan = plans.find((p) => p.id === planId)
  const newEnd = plan ? addDays(startDate, plan.duration_days) : ''

  async function confirmRenew() {
    if (!plan) return
    setBusy(true)
    const { error } = await supabase
      .from('gym_members')
      .update({ plan_id: planId, start_date: startDate, end_date: newEnd })
      .eq('id', member.id)
    setBusy(false)
    if (!error) onRenewed()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Renew {member.name}'s membership</DialogTitle>
          <DialogDescription>
            Choose a plan and start date — the end date is calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
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
            <Label>New start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>New end date</Label>
            <Input
              readOnly
              value={newEnd ? new Date(`${newEnd}T00:00:00`).toLocaleDateString('en-IN') : 'Select a plan to calculate'}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={confirmRenew} disabled={busy || !planId}>
            {busy ? 'Renewing...' : 'Confirm renewal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
