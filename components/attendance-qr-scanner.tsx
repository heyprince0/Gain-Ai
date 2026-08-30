'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

function gymIdFromPayload(value: string) {
  try {
    const url = new URL(value)
    if (url.pathname !== '/attendance/checkin') return null
    return url.searchParams.get('gym')
  } catch {
    return null
  }
}

export function AttendanceQrScanner() {
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [started, setStarted] = useState(false)

  async function stop() {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => undefined)
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setStarted(false)
  }

  async function checkin(gymId: string) {
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setStatus('Please sign in to GainAi before checking in.')
      setBusy(false)
      return
    }
    const { data: member } = await supabase.from('gym_members').select('id, app_access, end_date').eq('gym_id', gymId).eq('profile_id', user.id).maybeSingle()
    if (!member || !member.app_access) setStatus('Access not enabled. Please contact your gym administrator.')
    else if (new Date(`${member.end_date}T23:59:59`).getTime() < Date.now()) setStatus('Your membership has expired.')
    else {
      const { error } = await supabase.from('gym_attendance').insert({ gym_id: gymId, member_id: member.id, attendance_date: new Date().toISOString().slice(0, 10) })
      setStatus(error?.code === '23505' ? 'Already checked in today.' : error ? 'Could not log attendance.' : 'Attendance logged successfully.')
    }
    setBusy(false)
    await stop()
  }

  async function start() {
    setStatus('')
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('attendance-qr-reader')
    scannerRef.current = scanner
    try {
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 230, height: 230 } }, async (decoded) => {
        const gymId = gymIdFromPayload(decoded)
        if (!gymId) return setStatus('That QR code is not a GainAi gym attendance code.')
        await checkin(gymId)
      }, () => undefined)
      setStarted(true)
    } catch {
      setStatus('Camera access is unavailable. Allow camera permissions and try again.')
      scannerRef.current = null
    }
  }

  useEffect(() => () => { void stop() }, [])

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Camera /></div><CardTitle>Scan gym QR</CardTitle><CardDescription>Point your camera at the QR code displayed at your gym entrance.</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-4"><div id="attendance-qr-reader" className="overflow-hidden rounded-2xl bg-muted" aria-label="QR scanner" />{status && <p className="flex items-center gap-2 rounded-xl bg-muted p-4 text-sm"><CheckCircle2 className="size-4 shrink-0 text-primary" />{status}</p>}{busy ? <Button disabled className="w-full"><Loader2 data-icon="inline-start" className="animate-spin" />Logging attendance...</Button> : started ? <Button variant="outline" onClick={() => void stop()} className="w-full">Stop scanner</Button> : <Button onClick={() => void start()} className="w-full"><Camera data-icon="inline-start" />Start camera</Button>}</CardContent>
    </Card>
  )
}
