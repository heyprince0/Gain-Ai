'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function AttendanceCalendar({ memberId }: { memberId: string }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [attendedDays, setAttendedDays] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const todayStr = toISODate(new Date())

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)

    supabase
      .from('gym_attendance')
      .select('attendance_date')
      .eq('member_id', memberId)
      .gte('attendance_date', toISODate(monthStart))
      .lte('attendance_date', toISODate(monthEnd))
      .then(({ data }) => {
        if (cancelled) return
        setAttendedDays(new Set((data ?? []).map((row) => row.attendance_date as string)))
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
      const iso = toISODate(new Date(year, month, day))
      out.push({ day, iso })
    }
    return out
  }, [year, month])

  const totalAttended = attendedDays.size
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function goToPrevMonth() {
    setCursor(new Date(year, month - 1, 1))
  }

  function goToNextMonth() {
    setCursor(new Date(year, month + 1, 1))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="flex size-8 items-center justify-center rounded-lg border border-border/50 hover:bg-muted/40"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-center">
          <p className="font-medium">{MONTH_LABEL_FORMAT.format(cursor)}</p>
          <p className="text-xs text-muted-foreground">
            {loading ? 'Loading...' : `${totalAttended} / ${daysInMonth} days attended`}
          </p>
        </div>
        <button
          onClick={goToNextMonth}
          className="flex size-8 items-center justify-center rounded-lg border border-border/50 hover:bg-muted/40"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />
          const isAttended = attendedDays.has(cell.iso)
          const isToday = cell.iso === todayStr
          return (
            <div
              key={cell.iso}
              className={[
                'flex aspect-square flex-col items-center justify-center rounded-lg text-sm',
                isAttended ? 'bg-green-500/15 font-semibold text-green-600 dark:text-green-400' : 'text-foreground',
                isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : '',
              ].join(' ')}
            >
              {cell.day}
              {isAttended && <span className="mt-0.5 size-1 rounded-full bg-green-500" />}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-green-500/40" />
          Attended
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full ring-2 ring-primary" />
          Today
        </span>
      </div>

      {!loading && totalAttended === 0 && (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          No attendance records for this month yet.
        </p>
      )}
    </div>
  )
}
