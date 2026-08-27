'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CalendarCheck } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AttendanceQrScanner } from '@/components/attendance-qr-scanner'
import { supabase } from '@/lib/supabase'

function CheckinContent() {
  const params = useSearchParams()
  const gymId = params.get('gym')
  const [gym, setGym] = useState<{ gym_name: string } | null>(null)

  useEffect(() => {
    if (gymId) void supabase.from('gyms').select('gym_name').eq('id', gymId).single().then(({ data }) => setGym(data))
  }, [gymId])

  if (!gymId) return <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4"><AttendanceQrScanner /></main>

  return <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-muted/30 p-4">
    <Card className="w-full max-w-md text-center"><CardHeader><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CalendarCheck /></div><CardTitle>{gym?.gym_name ?? 'Gym attendance'}</CardTitle><CardDescription>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</CardDescription></CardHeader></Card>
    <AttendanceQrScanner />
  </main>
}

export default function AttendanceCheckin() {
  return (
    <Suspense fallback={null}>
      <CheckinContent />
    </Suspense>
  )
}
