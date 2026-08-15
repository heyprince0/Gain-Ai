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
      out.push({ day, iso: toISODate(new Date(year, month, day)) })
    }
    return out
  }, [year, month])

  const totalAttended = attendedDays.size

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
          const isAttended = attendedDays.has(cell.iso)
          const isToday = cell.iso === todayStr
          return (
            <div key={cell.iso} className="flex items-center justify-center py-0.5">
              <span
                className={[
                  'flex size-7 items-center justify-center rounded-full text-xs',
                  isAttended ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground',
                  isToday && !isAttended ? 'border border-primary text-primary' : '',
                ].join(' ')}
              >
                {cell.day}
              </span>
            </div>
          )
        })}
      </div>

      {!loading && totalAttended === 0 && (
        <p className="text-center text-xs text-muted-foreground">No visits logged this month.</p>
      )}
    </div>
  )
}
