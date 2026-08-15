'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ScanLine, XCircle } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'

const SCANNER_ELEMENT_ID = 'gym-attendance-qr-reader'

type ScanState =
  | { status: 'scanning' }
  | { status: 'checking' }
  | { status: 'success'; message: string }
  | { status: 'already'; message: string }
  | { status: 'error'; message: string }

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
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (!open) return

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

    return () => {
      scanner.stop().then(() => scanner.clear()).catch(() => {})
      scannerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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

    const { data: member, error: memberError } = await supabase
      .from('gym_members')
      .select('id, app_access')
      .eq('linked_profile_id', userId)
      .eq('gym_id', gymId)
      .is('deleted_at', null)
      .maybeSingle()

    if (memberError || !member) {
      setState({ status: 'error', message: 'This QR code doesn\'t belong to your gym.' })
      return
    }

    if (!member.app_access) {
      setState({ status: 'error', message: 'Your gym access is disabled. Please contact your gym.' })
      return
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

  async function handleClose(next: boolean) {
    if (!next) await stopCamera()
    onOpenChange(next)
  }

  function retry() {
    setState({ status: 'scanning' })
    if (scannerRef.current) {
      scannerRef.current
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => handleScan(decodedText),
          () => {}
        )
        .catch(() => setState({ status: 'error', message: 'Could not access the camera.' }))
    }
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

          {state.status === 'success' && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-[#00ff88]" />
              <p className="text-sm font-semibold text-foreground">{state.message}</p>
            </div>
          )}

          {state.status === 'already' && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-[#00ff88]" />
              <p className="text-sm font-semibold text-foreground">{state.message}</p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <XCircle className="h-10 w-10 text-red-500" />
              <p className="text-sm text-muted-foreground">{state.message}</p>
              <button
                onClick={retry}
                className="rounded-xl border border-border/50 px-4 py-2 text-sm font-medium hover:bg-muted/40"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
