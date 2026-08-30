'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Calendar, Activity, Loader2 } from 'lucide-react'

interface FoodScan {
  scanned_at: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

interface BodyScan {
  scanned_at: string
  body_fat?: number
  body_fat_percent?: number
}

interface WorkoutLog {
  workout_date: string
  completed: boolean
}

export function ProgressContent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'1w' | '1m' | '3m'>('1w')
  const [calorieData, setCalorieData] = useState<any[]>([])
  const [bodyFatData, setBodyFatData] = useState<any[]>([])
  const [workoutData, setWorkoutData] = useState<any[]>([])
  const [streak, setStreak] = useState(0)
  const [goalsHit, setGoalsHit] = useState(0)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        setLoading(true)

        // Calculate date range
        const now = new Date()
        let startDate = new Date()
        if (period === '1w') startDate.setDate(now.getDate() - 7)
        else if (period === '1m') startDate.setDate(now.getDate() - 30)
        else if (period === '3m') startDate.setDate(now.getDate() - 90)

        // Fetch calorie data
        const { data: scans } = await supabase
          .from('food_scans')
          .select('scanned_at, calories, protein, carbs, fats')
          .eq('user_id', user.id)
          .gte('scanned_at', startDate.toISOString())
          .order('scanned_at', { ascending: true })

        if (scans) {
          const grouped: Record<string, { calories: number; protein: number; carbs: number; fats: number }> = {}
          scans.forEach((scan: FoodScan) => {
            const date = new Date(scan.scanned_at).toLocaleDateString('en-IN', {
              timeZone: 'Asia/Kolkata',
              month: 'short',
              day: 'numeric'
            })
            if (!grouped[date]) {
              grouped[date] = { calories: 0, protein: 0, carbs: 0, fats: 0 }
            }
            grouped[date].calories += scan.calories
            grouped[date].protein += scan.protein
            grouped[date].carbs += scan.carbs
            grouped[date].fats += scan.fats
          })

          const chartData = Object.entries(grouped).map(([date, data]) => ({
            date,
            ...data,
          }))

          setCalorieData(chartData)
        }

        // Fetch body fat progression
        const { data: bodyscans } = await supabase
          .from('body_scans')
          .select('scanned_at, body_fat, body_fat_percent')
          .eq('user_id', user.id)
          .gte('scanned_at', startDate.toISOString())
          .order('scanned_at', { ascending: true })
          .limit(10)

        if (bodyscans) {
          const bodyData = bodyscans.map((scan: BodyScan) => ({
            date: new Date(scan.scanned_at).toLocaleDateString('en-IN', {
              timeZone: 'Asia/Kolkata',
              month: 'short',
              day: 'numeric'
            }),
            bodyFat: scan.body_fat || scan.body_fat_percent || 0,
          }))
          setBodyFatData(bodyData)
        }

        // Fetch workout consistency
        const { data: logs } = await supabase
          .from('workout_logs')
          .select('workout_date, completed')
          .eq('user_id', user.id)
          .gte('workout_date', startDate.toISOString().split('T')[0])
          .order('workout_date', { ascending: true })

        if (logs) {
          const completed = logs.filter((l: WorkoutLog) => l.completed).length
          const total = logs.length
          setGoalsHit(completed)

          // Group workouts by week
          const workoutGrouped: Record<string, number> = {}
          logs.forEach((log: WorkoutLog) => {
            const date = new Date(`${log.workout_date}T00:00:00Z`)
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay())
            const weekLabel = weekStart.toLocaleDateString('en-IN', {
              timeZone: 'Asia/Kolkata',
              month: 'short',
              day: 'numeric'
            })
            if (!workoutGrouped[weekLabel]) workoutGrouped[weekLabel] = 0
            if (log.completed) workoutGrouped[weekLabel]++
          })

          const workoutChartData = Object.entries(workoutGrouped).map(([week, count]) => ({
            week,
            completed: count,
          }))

          setWorkoutData(workoutChartData)
        }

        // Calculate streak
        const { data: allLogs } = await supabase
          .from('food_scans')
          .select('scanned_at')
          .eq('user_id', user.id)
          .order('scanned_at', { ascending: false })

        if (allLogs && allLogs.length > 0) {
          const istDateKey = (iso: string) =>
            new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(new Date(iso))

          const days = new Set(allLogs.map((s) => istDateKey(s.scanned_at)))
          const todayKey = istDateKey(new Date().toISOString())

          let cursor = new Date(`${todayKey}T00:00:00+05:30`)
          if (!days.has(todayKey)) {
            cursor.setDate(cursor.getDate() - 1)
          }

          let streakCount = 0
          while (true) {
            const key = new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(cursor)
            if (!days.has(key)) break
            streakCount += 1
            cursor.setDate(cursor.getDate() - 1)
          }

          setStreak(streakCount)
        }
      } catch (error) {
        console.error('Error fetching progress data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, period])

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-2xl w-full px-4 py-6 pb-24'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight text-foreground'>
          Your Progress
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your fitness journey over time
        </p>
      </div>

      {/* Period Selector */}
      <Tabs value={period} onValueChange={(val) => setPeriod(val as '1w' | '1m' | '3m')} className='mb-6'>
        <TabsList className='grid w-full grid-cols-3 rounded-xl bg-muted/50'>
          <TabsTrigger value='1w' className='rounded-lg text-sm'>1 Week</TabsTrigger>
          <TabsTrigger value='1m' className='rounded-lg text-sm'>1 Month</TabsTrigger>
          <TabsTrigger value='3m' className='rounded-lg text-sm'>3 Months</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 gap-3 mb-6'>
        <Card className='rounded-2xl border-border/50'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <TrendingUp className='h-4 w-4 text-primary' />
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Current Streak</span>
            </div>
            <div className='text-2xl font-bold text-foreground'>{streak}</div>
            <p className='text-xs text-muted-foreground mt-1'>days logging</p>
          </CardContent>
        </Card>

        <Card className='rounded-2xl border-border/50'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <Activity className='h-4 w-4 text-primary' />
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Workouts</span>
            </div>
            <div className='text-2xl font-bold text-foreground'>{goalsHit}</div>
            <p className='text-xs text-muted-foreground mt-1'>completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Calorie Trends */}
      {calorieData.length > 0 && (
        <Card className='rounded-2xl border-border/50 mb-6'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-4'>
              <Calendar className='h-4 w-4 text-primary' />
              <h3 className='text-sm font-semibold text-foreground'>Daily Calories</h3>
            </div>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={calorieData}>
                <CartesianGrid strokeDasharray='3 3' stroke='currentColor' opacity={0.1} />
                <XAxis dataKey='date' stroke='currentColor' opacity={0.5} fontSize={12} />
                <YAxis stroke='currentColor' opacity={0.5} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.75rem'
                  }}
                  cursor={{ fill: 'rgba(0,255,136,0.1)' }}
                />
                <Bar dataKey='calories' fill='#00ff88' radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Macro Breakdown */}
      {calorieData.length > 0 && (
        <Card className='rounded-2xl border-border/50 mb-6'>
          <CardContent className='p-4'>
            <h3 className='text-sm font-semibold text-foreground mb-4'>Macro Trends</h3>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={calorieData}>
                <CartesianGrid strokeDasharray='3 3' stroke='currentColor' opacity={0.1} />
                <XAxis dataKey='date' stroke='currentColor' opacity={0.5} fontSize={12} />
                <YAxis stroke='currentColor' opacity={0.5} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.75rem'
                  }}
                />
                <Legend />
                <Line type='monotone' dataKey='protein' stroke='#3b82f6' dot={false} strokeWidth={2} />
                <Line type='monotone' dataKey='carbs' stroke='#f59e0b' dot={false} strokeWidth={2} />
                <Line type='monotone' dataKey='fats' stroke='#ec4899' dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Body Fat Progression */}
      {bodyFatData.length > 0 && (
        <Card className='rounded-2xl border-border/50 mb-6'>
          <CardContent className='p-4'>
            <h3 className='text-sm font-semibold text-foreground mb-4'>Body Fat Progress</h3>
            <ResponsiveContainer width='100%' height={250}>
              <LineChart data={bodyFatData}>
                <CartesianGrid strokeDasharray='3 3' stroke='currentColor' opacity={0.1} />
                <XAxis dataKey='date' stroke='currentColor' opacity={0.5} fontSize={12} />
                <YAxis stroke='currentColor' opacity={0.5} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.75rem'
                  }}
                />
                <Line type='monotone' dataKey='bodyFat' stroke='#00ff88' dot={{ fill: '#00ff88' }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Workout Consistency */}
      {workoutData.length > 0 && (
        <Card className='rounded-2xl border-border/50 mb-6'>
          <CardContent className='p-4'>
            <h3 className='text-sm font-semibold text-foreground mb-4'>Weekly Workouts</h3>
            <ResponsiveContainer width='100%' height={250}>
              <BarChart data={workoutData}>
                <CartesianGrid strokeDasharray='3 3' stroke='currentColor' opacity={0.1} />
                <XAxis dataKey='week' stroke='currentColor' opacity={0.5} fontSize={12} />
                <YAxis stroke='currentColor' opacity={0.5} fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.75rem'
                  }}
                />
                <Bar dataKey='completed' fill='#00ff88' radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {calorieData.length === 0 && bodyFatData.length === 0 && workoutData.length === 0 && (
        <Card className='rounded-2xl border-border/50'>
          <CardContent className='p-8 text-center'>
            <TrendingUp className='h-8 w-8 text-muted-foreground/30 mx-auto mb-3' />
            <p className='text-sm text-muted-foreground'>No data available yet</p>
            <p className='text-xs text-muted-foreground mt-1'>Start logging your meals and workouts to see progress</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
