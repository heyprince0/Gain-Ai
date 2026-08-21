'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

const getMembershipStatus = (endDate: string) => {
  if (!endDate) return { label: 'No end date', color: 'bg-gray-500', icon: AlertCircle }
  const now = new Date()
  const end = new Date(endDate)
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) {
    return { label: 'Expired', color: 'bg-red-500', icon: XCircle }
  } else if (diffDays <= 7) {
    return { label: `Expiring soon (${diffDays} days)`, color: 'bg-yellow-500', icon: AlertCircle }
  } else {
    return { label: `Active (${diffDays} days left)`, color: 'bg-green-500', icon: CheckCircle2 }
  }
}

interface GymMembership {
  id: string
  name: string
  phone: string
  start_date: string
  end_date: string
  app_access: boolean
  gym_subscription_plans?: {
    plan_name: string
    price: number
  }
}

interface AttendanceRecord {
  attendance_date: string
  scanned_at: string
}

export function MembershipContent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [membership, setMembership] = useState<GymMembership | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMembershipData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError
        if (!profile?.phone) {
          setError('No phone number linked to your account. Please contact your gym.')
          setLoading(false)
          return
        }

        const { data: memberData, error: memberError } = await supabase
          .from('gym_members')
          .select(`
            id,
            name,
            phone,
            start_date,
            end_date,
            app_access,
            gym_subscription_plans (
              plan_name,
              price
            )
          `)
          .eq('phone', profile.phone)
          .eq('deleted_at', null)
          .single()

        if (memberError) {
          setError('No gym membership found for this phone number.')
          setLoading(false)
          return
        }

        setMembership(memberData as GymMembership)

        const { data: attendanceData, error: attendanceError } = await supabase
          .from('gym_attendance')
          .select('attendance_date, scanned_at')
          .eq('member_id', memberData.id)
          .order('attendance_date', { ascending: false })
          .limit(30)

        if (!attendanceError && attendanceData) {
          setAttendance(attendanceData as AttendanceRecord[])
        }
      } catch (err) {
        console.error('Error fetching membership:', err)
        setError('Failed to load membership data')
      } finally {
        setLoading(false)
      }
    }

    fetchMembershipData()
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl w-full px-4 py-6 pb-24">
        <Card className="rounded-2xl border-red-500/20 bg-red-500/5">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
            <h3 className="text-lg font-semibold text-foreground">No Membership Found</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <p className="text-xs text-muted-foreground mt-4">
              If you think this is a mistake, please contact your gym administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!membership) {
    return (
      <div className="mx-auto max-w-2xl w-full px-4 py-6 pb-24">
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No membership data available.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = getMembershipStatus(membership.end_date)
  const StatusIcon = status.icon

  return (
    <div className="mx-auto max-w-2xl w-full px-4 py-6 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Membership</h1>
        <p className="text-sm text-muted-foreground mt-1">View your gym subscription and attendance</p>
      </div>

      <Card className="rounded-2xl border-border/50 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>{membership.name}</span>
            <Badge className={`${status.color} text-white`}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</p>
              <p className="text-lg font-semibold text-foreground">
                {membership.gym_subscription_plans?.plan_name || 'Basic'}
              </p>
              {membership.gym_subscription_plans?.price && (
                <p className="text-sm text-muted-foreground">₹{membership.gym_subscription_plans.price}/month</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
              <p className="text-lg font-semibold text-foreground">
                {membership.app_access ? 'Active' : 'Inactive'}
              </p>
              <p className="text-sm text-muted-foreground">
                {membership.app_access ? 'App access enabled' : 'App access disabled'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</p>
              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                <CalendarDays className="h-4 w-4 text-primary" />
                {formatDate(membership.start_date)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Renewal Date</p>
              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                <CalendarDays className="h-4 w-4 text-primary" />
                {formatDate(membership.end_date)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No attendance records found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendance.map((record) => (
                <div key={record.attendance_date} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <span className="text-sm font-medium text-foreground">{formatDate(record.attendance_date)}</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Intl.DateTimeFormat('en-IN', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    }).format(new Date(record.scanned_at))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
