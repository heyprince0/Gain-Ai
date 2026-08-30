'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Phone, MapPin, Save, Trash2, Bell, Send } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { GymOwnerShell } from '@/components/gym-owner-shell'
import { AttendanceCalendar } from '@/components/attendance-calendar'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, memberStatus, type GymMember } from '@/lib/gym-owner'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [member, setMember] = useState<GymMember | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '', start_date: '', end_date: '' })
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Notification state
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody] = useState('')
  const [sending, setSending] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    supabase
      .from('gym_members')
      .select('*, gym_subscription_plans(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setMember(data as GymMember)
          setForm({
            name: data.name,
            phone: data.phone,
            address: data.address,
            start_date: data.start_date,
            end_date: data.end_date,
          })
        }
      })
  }, [id])

  async function access(value: boolean) {
    if (!member) return
    await supabase.from('gym_members').update({ app_access: value }).eq('id', member.id)
    setMember({ ...member, app_access: value })
  }

  async function save() {
    if (!member) return
    await supabase.from('gym_members').update(form).eq('id', member.id)
    setMember({ ...member, ...form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function removeMember() {
    if (!member) return
    setDeleting(true)
    const { error } = await supabase
      .from('gym_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', member.id)
    if (error) {
      console.error('Delete error:', error)
      setDeleting(false)
      return
    }
    router.replace('/gym-owner/dashboard')
  }

  // ✅ Send notification to this member
  async function sendNotification() {
    if (!member || !notifTitle.trim() || !notifBody.trim()) return

    // ✅ CRITICAL: must use linked_profile_id (auth UUID), NOT member.id (gym_members row UUID)
    // RLS on notifications checks: auth.uid() = member_id
    // So member_id must be the member's auth UUID, not the gym_members row id
    if (!member.linked_profile_id) {
      setNotifStatus('error')
      return
    }

    setSending(true)
    setNotifStatus('idle')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: member.linked_profile_id, // ← auth UUID, not gym_members.id
          gym_id: member.gym_id,
          title: notifTitle.trim(),
          body: notifBody.trim(),
          type: 'general',
          url: '/membership',
        }),
      })

      if (!res.ok) throw new Error('Send failed')
      setNotifStatus('success')
      setNotifTitle('')
      setNotifBody('')
      setTimeout(() => setNotifStatus('idle'), 3000)
    } catch (err) {
      console.error('Send notification error:', err)
      setNotifStatus('error')
    } finally {
      setSending(false)
    }
  }

  if (!member) {
    return (
      <GymOwnerShell title="Member profile">
        <p className="text-sm text-muted-foreground">Loading member profile...</p>
      </GymOwnerShell>
    )
  }

  const status = memberStatus(member.end_date)
  const isConnected = !!member.linked_profile_id

  return (
    <GymOwnerShell title="Member profile">
      <div className="flex flex-col gap-6">
        <Link
          href="/gym-owner/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to members
        </Link>

        <Card>
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold">{member.name}</h2>
                  <StatusBadge status={status} />
                </div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Phone className="size-4" />
                    {member.phone}
                    <Badge
                      variant={isConnected ? 'outline' : 'secondary'}
                      className={isConnected ? 'ml-1 border-transparent bg-green-500/15 text-green-600 dark:text-green-400' : 'ml-1'}
                    >
                      {isConnected ? 'App connected' : 'Not connected yet'}
                    </Badge>
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    {member.address}
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="font-medium">{member.gym_subscription_plans?.plan_name ?? 'No plan'}</p>
                <p className="text-sm text-muted-foreground">₹{member.gym_subscription_plans?.price ?? '—'}</p>
                <p className="mt-2 text-sm">
                  {formatDate(member.start_date)} — {formatDate(member.end_date)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 border-t pt-5 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>End date</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Editing these dates directly overrides the plan's automatic calculation.
            </p>
            <p className="text-xs text-muted-foreground">
              If you change the phone number here, the member's app will re-link automatically the next time
              they scan the attendance QR with that number.
            </p>

            <Button variant="outline" className="w-fit" onClick={save}>
              <Save data-icon="inline-start" />
              {saved ? 'Saved' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>

        {/* ✅ NEW: Send Notification Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!isConnected ? (
              <p className="text-sm text-muted-foreground">
                This member hasn't connected the GainAi app yet — notifications can't be sent until they do.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g. Subscription Expiring Soon"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    maxLength={60}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="e.g. Your subscription expires in 3 days. Renew now to keep access."
                    value={notifBody}
                    onChange={(e) => setNotifBody(e.target.value)}
                    rows={3}
                    maxLength={200}
                  />
                </div>

                {notifStatus === 'success' && (
                  <p className="text-sm text-green-600 dark:text-green-400">Notification sent successfully.</p>
                )}
                {notifStatus === 'error' && (
                  <p className="text-sm text-destructive">Failed to send. Try again.</p>
                )}

                <Button
                  className="w-fit"
                  onClick={sendNotification}
                  disabled={sending || !notifTitle.trim() || !notifBody.trim()}
                >
                  <Send className="mr-2 size-4" />
                  {sending ? 'Sending...' : 'Send notification'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GainAi app access</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{member.app_access ? 'Access enabled' : 'Access disabled'}</p>
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? 'This member has connected their GainAi app account to this phone number.'
                  : "This member hasn't scanned the attendance QR yet, so their app account isn't connected."}
              </p>
            </div>
            <Switch checked={member.app_access} onCheckedChange={access} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceCalendar memberId={member.id} />
          </CardContent>
        </Card>

        <div className="flex justify-end border-t pt-5">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 data-icon="inline-start" />
            Remove member
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {member.name} from your gym and their attendance history.
              This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeMember} disabled={deleting}>
              {deleting ? 'Removing...' : 'Remove member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GymOwnerShell>
  )
}
