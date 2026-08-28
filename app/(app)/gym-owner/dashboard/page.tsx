'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ElementType } from 'react'
import { Plus, Search, Users, UserCheck, Clock3, CalendarCheck, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { GymOwnerShell } from '@/components/gym-owner-shell'
import { StatusBadge } from '@/components/status-badge'
import { getOwnerData, memberStatus, formatDate, type GymMember, type Gym, type Plan } from '@/lib/gym-owner'
import { supabase } from '@/lib/supabase'

export default function OwnerDashboard() {
  const router = useRouter()
  const [gym, setGym] = useState<Gym | null>(null)
  const [members, setMembers] = useState<GymMember[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [todayCount, setTodayCount] = useState<number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadOwnerDashboard() {
      setLoading(true)
      setLoadError(null)

      try {
        const { data } = await supabase.auth.getSession()

        if (!data.session?.user) {
          if (!cancelled) router.replace('/gym-owner/login')
          return
        }

        const ownerData = await getOwnerData(data.session.user.id)
        if (cancelled) return

        setGym(ownerData.gym)
        setMembers(ownerData.members)
        setPlans(ownerData.plans)

        if (ownerData.gym) {
          void fetchTodayAttendance(ownerData.gym.id)
        } else {
          setTodayCount(0)
        }
      } catch (error) {
        console.error('[v0] Error loading gym owner dashboard:', error)
        if (!cancelled) setLoadError('Unable to load your gym data. Please refresh and try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadOwnerDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  async function fetchTodayAttendance(gymId: string) {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())

    // Fetching actual rows and taking the length instead of a head-count
    // query — head-count + filters was returning the gym's total attendance
    // instead of just today's, so this is the reliable version.
    const { data } = await supabase
      .from('gym_attendance')
      .select('id')
      .eq('gym_id', gymId)
      .eq('attendance_date', today)

    setTodayCount(data?.length ?? 0)
  }

  const filtered = useMemo(
    () => members.filter((m) => `${m.name} ${m.phone}`.toLowerCase().includes(query.toLowerCase())),
    [members, query]
  )

  const active = members.filter((m) => memberStatus(m.end_date) === 'Active').length
  const expiring = members.filter((m) => memberStatus(m.end_date) === 'Expiring soon').length

  const stats: Array<[ElementType, string, string | number]> = [
    [Users, 'Total members', members.length],
    [UserCheck, 'Active members', active],
    [Clock3, 'Expiring soon', expiring],
    [CalendarCheck, "Today's attendance", todayCount === null ? '—' : todayCount],
  ]

  return (
    <GymOwnerShell title="Overview">
      <div className="flex flex-col gap-8">
        {loadError && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <p className="font-medium">{loadError}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh dashboard
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm text-muted-foreground">Good to see you</p>
            <h2 className="text-3xl font-semibold tracking-tight">{gym?.gym_name ?? 'Your gym'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {gym?.owner_name ? `Owner workspace for ${gym.owner_name}` : 'Finish setup to start managing members.'}
            </p>
          </div>
          <Button asChild>
            <Link href="/gym-owner/members/new">
              <Plus data-icon="inline-start" />
              Add member
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(([Icon, label, value]) => (
            <Card key={label as string}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-xl font-semibold">{value as string}</p>
                  <p className="text-xs text-muted-foreground">{label as string}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold">Members</h3>
                <p className="text-sm text-muted-foreground">Keep subscriptions and access up to date.</p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search name or phone"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Loading members...</p>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
                <Users className="size-8 text-muted-foreground" />
                <h4 className="font-medium">{query ? 'No members found' : 'No members yet'}</h4>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Add your first member to start tracking plans and attendance.
                </p>
                <Button asChild size="sm">
                  <Link href="/gym-owner/members/new">
                    <Plus data-icon="inline-start" />
                    Add member
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b text-xs text-muted-foreground">
                    <tr>
                      {['Member', 'Phone', 'Plan', 'End date', 'Status', 'Access', ''].map((h) => (
                        <th className="px-3 py-3 font-medium" key={h}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((member) => {
                      const status = memberStatus(member.end_date)
                      return (
                        <tr key={member.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="px-3 py-4 font-medium">{member.name}</td>
                          <td className="px-3 py-4 text-muted-foreground">{member.phone}</td>
                          <td className="px-3 py-4">{member.gym_subscription_plans?.plan_name ?? 'No plan'}</td>
                          <td className="px-3 py-4">{formatDate(member.end_date)}</td>
                          <td className="px-3 py-4">
                            <StatusBadge status={status} />
                          </td>
                          <td className="px-3 py-4">
                            {member.app_access ? (
                              <Badge variant="outline">Enabled</Badge>
                            ) : (
                              <Badge variant="secondary">Off</Badge>
                            )}
                          </td>
                          <td className="px-3 py-4">
                            <Button asChild variant="ghost" size="icon">
                              <Link href={`/gym-owner/members/${member.id}`}>
                                <ArrowUpRight />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </GymOwnerShell>
  )
}
