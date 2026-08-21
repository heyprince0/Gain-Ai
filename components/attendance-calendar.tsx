'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Circle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })
const TIME_FORMAT = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})
const DATE_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function todayISOInIST() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function AttendanceCalendar({ memberId }: { memberId: string }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [attendance, setAttendance] = useState<Map<string, string>>(new Map()) // iso date -> scanned_at
  const [loading, setLoading] = useState(true)
  const [selectedDateInfo, setSelectedDateInfo] = useState<{ iso: string; scannedAt: string } | null>(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const todayStr = todayISOInIST()
  const isCurrentMonthView = year === new Date().getFullYear() && month === new Date().getMonth()

  // Clear selection when month changes
  useEffect(() => {
    setSelectedDateInfo(null)
  }, [year, month])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)

    supabase
      .from('gym_attendance')
      .select('attendance_date, scanned_at')
      .eq('member_id', memberId)
      .gte('attendance_date', toISODate(monthStart))
      .lte('attendance_date', toISODate(monthEnd))
      .then(({ data }) => {
        if (cancelled) return
        const map = new Map<string, string>()
        for (const row of data ?? []) {
          map.set(row.attendance_date as string, row.scanned_at as string)
        }
        setAttendance(map)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [memberId, year, month])

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const out: Array<{ day: number; iso: string } | null> = []
    for (let i = 0; i < firstWeekday; i++) out.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      out.push({ day, iso: toISODate(new Date(year, month, day)) })
    }
    return out
  }, [year, month])

  const totalAttended = attendance.size
  const todayScannedAt = attendance.get(todayStr)

  const handleDateClick = (iso: string, scannedAt: string) => {
    if (selectedDateInfo?.iso === iso) {
      setSelectedDateInfo(null) // toggle off if same date clicked again
    } else {
      setSelectedDateInfo({ iso, scannedAt })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-medium">
          {MONTH_LABEL_FORMAT.format(cursor)}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {loading ? '…' : `${totalAttended} visit${totalAttended === 1 ? '' : 's'}`}
          </span>
        </p>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-[11px] text-muted-foreground">
            {label}
          </div>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />
          const scannedAt = attendance.get(cell.iso)
          const isAttended = !!scannedAt
          const isToday = cell.iso === todayStr
          const isSelected = selectedDateInfo?.iso === cell.iso
          const tooltip = isAttended ? `Checked in at ${TIME_FORMAT.format(new Date(scannedAt))}` : undefined

          return (
            <div key={cell.iso} className="flex items-center justify-center py-0.5">
              <span
                title={tooltip}
                onClick={() => isAttended && handleDateClick(cell.iso, scannedAt)}
                className={[
                  'flex size-7 items-center justify-center rounded-full text-xs transition-colors cursor-default',
                  isAttended
                    ? 'bg-primary text-primary-foreground font-medium hover:opacity-80'
                    : 'text-foreground',
                  isToday && !isAttended ? 'border border-primary text-primary' : '',
                  isSelected ? 'ring-2 ring-offset-1 ring-primary' : '',
                ].join(' ')}
              >
                {cell.day}
              </span>
            </div>
          )
        })}
      </div>

      {/* Today's status (only if current month) */}
      {isCurrentMonthView && (
        <div
          className={[
            'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs',
            todayScannedAt
              ? 'border-transparent bg-green-500/10 text-green-600 dark:text-green-400'
              : 'border-dashed text-muted-foreground',
          ].join(' ')}
        >
          {todayScannedAt ? <CheckCircle2 className="size-3.5 shrink-0" /> : <Circle className="size-3.5 shrink-0" />}
          {todayScannedAt
            ? `Checked in today at ${TIME_FORMAT.format(new Date(todayScannedAt))}`
            : 'Not checked in yet today'}
        </div>
      )}

      {/* Selected date info (shown when a date with attendance is clicked) */}
      {selectedDateInfo && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          <CheckCircle2 className="size-3.5 shrink-0" />
          <span>
            Checked in on <span className="font-medium">{DATE_FORMAT.format(new Date(selectedDateInfo.iso))}</span> at{' '}
            <span className="font-mono">{TIME_FORMAT.format(new Date(selectedDateInfo.scannedAt))}</span>
          </span>
        </div>
      )}

      {!loading && totalAttended === 0 && !isCurrentMonthView && (
        <p className="text-center text-xs text-muted-foreground">No visits logged this month.</p>
      )}
    </div>
  )
}
