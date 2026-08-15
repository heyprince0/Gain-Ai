'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Phone, ScanLine, XCircle } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

const SCANNER_ELEMENT_ID = 'gym-attendance-qr-reader'

type ScanState =
  | { status: 'scanning' }
  | { status: 'checking' }
  | { status: 'needs_phone'; gymId: string }
  | { status: 'not_found'; gymId: string; phone: string }
  | { status: 'access_paused' }
  | { status: 'success'; message: string }
  | { status: 'already'; message: string }
  | { status: 'error'; message: string }

function last10Digits(phone: string) {
  return phone.replace(/\D/g, '').slice(-10)
}

export function QrScannerDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}) {
  const [state, setState] = useState<ScanState>({ status: 'scanning' })
  const [phoneInput, setPhoneInput] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (!open) return
    startCamera()
    return () => {
      scannerRef.current?.stop().then(() => scannerRef.current?.clear()).catch(() => {})
      scannerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function startCamera() {
    setState({ status: 'scanning' })
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
    scannerRef.current = scanner
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => handleScan(decodedText),
        () => {} // ignore per-frame "no QR found" noise
      )
      .catch(() => {
        setState({ status: 'error', message: 'Could not access the camera. Check camera permissions and try again.' })
      })
  }

  async function stopCamera() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {}
    }
  }

  async function handleScan(decodedText: string) {
    await stopCamera()
    setState({ status: 'checking' })

    let gymId: string | null = null
    try {
      gymId = new URL(decodedText).searchParams.get('gym')
    } catch {
      gymId = null
    }

    if (!gymId) {
      setState({ status: 'error', message: 'This doesn\'t look like a GainAi attendance QR code.' })
      return
    }

    // Phone number is the trigger for everything — check if we have one on file.
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', userId)
      .maybeSingle()

    if (!profileRow?.phone) {
      setPhoneInput('')
      setState({ status: 'needs_phone', gymId })
      return
    }

    await matchByPhone(profileRow.phone, gymId)
  }

  async function matchByPhone(phone: string, gymId: string) {
    setState({ status: 'checking' })

    const search = last10Digits(phone)

    const { data: candidates } = await supabase
      .from('gym_members')
      .select('id, app_access, linked_profile_id, phone')
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .ilike('phone', `%${search}%`)

    const member = candidates?.[0] ?? null

    if (!member) {
      setState({ status: 'not_found', gymId, phone })
      return
    }

    if (!member.app_access) {
      setState({ status: 'access_paused' })
      return
    }

    // First time this phone has scanned in — connect this profile to the
    // gym owner's member record, and mark the profile as belonging to this gym.
    if (!member.linked_profile_id) {
      await supabase.from('gym_members').update({ linked_profile_id: userId }).eq('id', member.id)
      await supabase.from('profiles').update({ gym_id: gymId }).eq('id', userId)
    }

    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())

    const { error: insertError } = await supabase
      .from('gym_attendance')
      .insert({ gym_id: gymId, member_id: member.id, attendance_date: today })

    if (insertError) {
      if (insertError.code === '23505') {
        setState({ status: 'already', message: 'You already checked in today ✓' })
      } else {
        setState({ status: 'error', message: 'Could not log attendance. Please try again.' })
      }
      return
    }

    setState({ status: 'success', message: 'Checked in — see you at the gym!' })
  }

  async function savePhoneAndContinue(gymId: string) {
    if (!phoneInput.trim()) return
    setSavingPhone(true)
    const { error } = await supabase.from('profiles').update({ phone: phoneInput.trim() }).eq('id', userId)
    setSavingPhone(false)
    if (error) {
      setState({ status: 'error', message: 'Could not save your phone number. Please try again.' })
      return
    }
    await matchByPhone(phoneInput.trim(), gymId)
  }

  async function handleClose(next: boolean) {
    if (!next) await stopCamera()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Scan Attendance
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            id={SCANNER_ELEMENT_ID}
            className={`w-full overflow-hidden rounded-2xl border border-border/50 ${state.status === 'scanning' ? '' : 'hidden'}`}
          />

          {state.status === 'scanning' && (
            <p className="text-center text-sm text-muted-foreground">
              Point your camera at the QR code at your gym's entrance.
            </p>
          )}

          {state.status === 'checking' && (
            <p className="py-10 text-center text-sm text-muted-foreground">Checking...</p>
          )}

          {state.status === 'needs_phone' && (
            <div className="flex w-full flex-col items-center gap-3 py-4 text-center">
              <Phone className="h-8 w-8 text-primary" />
              <p className="text-sm font-semibold text-foreground">Add your phone number</p>
              <p className="text-xs text-muted-foreground">
                We use this to connect you to your gym and log your attendance.
              </p>
              <Input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full"
              />
              <button
                onClick={() => savePhoneAndContinue(state.gymId)}
                disabled={savingPhone || !phoneInput.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00cc6a] py-2.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                {savingPhone ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          )}

          {state.status === 'not_found' && (
            <div className="flex w-full flex-col items-center gap-3 py-4 text-center">
              <Phone className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">We couldn't find your membership</p>
              <p className="text-xs text-muted-foreground">
                Your gym hasn't added this number yet. Double-check it below, or check with your gym.
              </p>
              <Input
                type="tel"
                value={phoneInput || state.phone}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full"
              />
              <button
                onClick={() => savePhoneAndContinue(state.gymId)}
                disabled={savingPhone || !(phoneInput || state.phone).trim()}
                className="w-full rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00cc6a] py-2.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                {savingPhone ? 'Checking...' : 'Try this number'}
              </button>
            </div>
          )}

          {state.status === 'access_paused' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Phone className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Access currently paused</p>
              <p className="text-xs text-muted-foreground">Please check with your gym to reactivate your access.</p>
              <button onClick={startCamera} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium hover:bg-muted/40">
                Try again
              </button>
            </div>
          )}

          {(state.status === 'success' || state.status === 'already') && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-[#00ff88]" />
              <p className="text-sm font-semibold text-foreground">{state.message}</p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <XCircle className="h-10 w-10 text-red-500" />
              <p className="text-sm text-muted-foreground">{state.message}</p>
              <button onClick={startCamera} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium hover:bg-muted/40">
                Try again
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
