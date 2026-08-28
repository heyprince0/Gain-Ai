'use client'

import { useEffect, useState } from 'react'
import { Activity, TrendingUp, Flame, Target, Calendar, Loader as Loader2, User, Dumbbell, Zap, Plus, Utensils, Clock, ScanLine } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { TodayWorkoutCard } from '@/components/today-workout-card'
import { WorkoutPlannerForm } from '@/components/workout-planner-form'
import { FuelScoreCard } from '@/components/fuel-score-card'
import { LogMealDialog } from '@/components/log-meal-dialog'
import { QrScannerDialog } from '@/components/qr-scanner-dialog'
import { AccessRevokedModal } from '@/components/access-revoked-modal'

interface Profile {
  id: string
  name: string
  age: number
  weight: number
  height: number
  goal: string
  gender?: string
  calorie_goal: number
  protein_goal: number
  carbs_goal?: number
  fat_goal?: number
  fiber_goal?: number
  bmr?: number
  tdee?: number
  created_at: string
  gym_id?: string | null
}

interface FoodScan {
  id?: string
  food_name: string
  calories: number
  total_calories?: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  health_score?: number
  health_rating?: string
  scanned_at: string
}

interface BodyScan {
  id: string
  scanned_at: string
  body_fat_percent?: number
  body_fat?: number
  body_type?: string
}

interface DailyLog {
  log_date: string
  scan_count: number
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fats: number
}

const formatIST = (dateString: string, timeOnly = false) => {
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(dateString)
  const date = new Date(hasTimezone ? dateString : `${dateString}Z`)
  if (timeOnly) {
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

// ✅ NEW: Streak calculated directly from food_scans (no reliance on daily_nutrition_log)
function calculateStreakFromScans(scans: FoodScan[], hasScannedToday: boolean): number {
  // Collect all scan dates (IST date string, e.g. "2026-08-28")
  const scanDates = new Set<string>()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  scans.forEach(scan => {
    const date = new Date(scan.scanned_at)
    const dateKey = formatter.format(date)
    scanDates.add(dateKey)
  })

  // Get today's date in IST
  const todayKey = formatter.format(new Date())
  if (hasScannedToday) scanDates.add(todayKey)

  // If no scans at all, streak is 0
  if (scanDates.size === 0) return 0

  // Start from today (or yesterday if today has no scan)
  let cursor = new Date(`${todayKey}T00:00:00+05:30`)
  if (!scanDates.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (true) {
    const key = formatter.format(cursor)
    if (!scanDates.has(key)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [foodScans, setFoodScans] = useState<FoodScan[]>([])
  const [todayScans, setTodayScans] = useState<FoodScan[]>([])
  const [weekScans, setWeekScans] = useState<FoodScan[]>([])
  const [weekCount, setWeekCount] = useState(0)
  const [weekLabel, setWeekLabel] = useState('')
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [bodyScan, setBodyScan] = useState<BodyScan | null>(null)
  const [showPlanner, setShowPlanner] = useState(false)
  const [hasWorkoutPlan, setHasWorkoutPlan] = useState(false)
  const [showLogMeal, setShowLogMeal] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [accessRevoked, setAccessRevoked] = useState(false)
  const [todayStats, setTodayStats] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 })
  const [todayFuelScore, setTodayFuelScore] = useState<number | null>(null)
  const [yesterdayFuelScore, setYesterdayFuelScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const displayName = profile?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'

  const refetchData = async () => {
    if (!user) return

    try {
      const getTodayIST = () => {
        const now = new Date()
        const istDate = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(now)
        const istMidnightUTC = new Date(`${istDate}T00:00:00+05:30`)
        return istMidnightUTC.toISOString()
      }

      const { data: todayData } = await supabase
        .from('food_scans')
        .select('*')
        .eq('user_id', user.id)
        .gte('scanned_at', getTodayIST())
        .order('scanned_at', { ascending: false })

      if (todayData) {
        setTodayScans(todayData)
        const todayCalories = todayData.reduce((sum, s) => sum + (s.calories ?? 0), 0) ?? 0
        const todayProtein = todayData.reduce((sum, s) => sum + (s.protein ?? 0), 0) ?? 0
        const todayCarbs = todayData.reduce((sum, s) => sum + (s.carbs ?? 0), 0) ?? 0
        const todayFats = todayData.reduce((sum, s) => sum + (s.fats ?? 0), 0) ?? 0
        setTodayStats({ calories: todayCalories, protein: todayProtein, carbs: todayCarbs, fats: todayFats })
      }

      const { data: foodData } = await supabase
        .from('food_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })

      if (foodData) setFoodScans(foodData)

      const { data: dailyLogData } = await supabase
        .from('daily_nutrition_log')
        .select('log_date, scan_count, total_calories, total_protein, total_carbs, total_fats')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })

      if (dailyLogData) setDailyLogs(dailyLogData)

      const istDateKey = (iso: string) =>
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(iso))

      const todayDate = istDateKey(new Date().toISOString())
      const yesterdayDate = istDateKey(new Date(Date.now() - 86400000).toISOString())

      const { data: fuelData } = await supabase
        .from('fuel_scores')
        .select('score_date, fuel_score')
        .eq('user_id', user.id)
        .in('score_date', [todayDate, yesterdayDate])

      if (fuelData) {
        const todayFuel = fuelData.find((r) => r.score_date === todayDate)?.fuel_score ?? null
        const yesterdayFuel = fuelData.find((r) => r.score_date === yesterdayDate)?.fuel_score ?? null
        setTodayFuelScore(todayFuel)
        setYesterdayFuelScore(yesterdayFuel)
      }
    } catch (error) {
      console.error('Error refetching data:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#00ff88'
    if (score >= 6) return '#86efac'
    if (score >= 4) return '#facc15'
    if (score >= 2) return '#fb923c'
    return '#ef4444'
  }

  const normalizeScore = (score: number) => {
    if (!score) return 0
    let s = score > 10 ? score / 10 : score
    s = Math.min(Math.max(s, 0), 10)
    return Math.round(s)
  }

  useEffect(() => {
    if (!user || !profile?.gym_id) return

    let cancelled = false

    async function checkAccess() {
      const { data } = await supabase
        .from('gym_members')
        .select('app_access')
        .eq('linked_profile_id', user!.id)
        .eq('gym_id', profile!.gym_id)
        .is('deleted_at', null)
        .maybeSingle()

      if (cancelled) return
      if (data && !data.app_access) setAccessRevoked(true)
    }

    void checkAccess()
    const interval = setInterval(checkAccess, 30000)

    function handleVisibility() {
      if (document.visibilityState === 'visible') void checkAccess()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user, profile?.gym_id])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, age, weight, height, goal, gender, calorie_goal, protein_goal, carbs_goal, fat_goal, fiber_goal, bmr, tdee, created_at, gym_id')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile error:', profileError)
        }
        if (profileData) setProfile(profileData)

        const getTodayIST = () => {
          const now = new Date()
          const istDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(now)
          const istMidnightUTC = new Date(`${istDate}T00:00:00+05:30`)
          return istMidnightUTC.toISOString()
        }

        const getWeekStart = () => {
          const now = new Date()
          const day = now.getDay()
          const diff = now.getDate() - day + (day === 0 ? -6 : 1)
          const monday = new Date(now.setDate(diff))
          monday.setHours(0, 0, 0, 0)
          return monday
        }
        const weekStart = getWeekStart()

        const { data: todayData, error: todayError } = await supabase
          .from('food_scans')
          .select('*')
          .eq('user_id', user.id)
          .gte('scanned_at', getTodayIST())
          .order('scanned_at', { ascending: false })

        if (todayError) console.error('Today scans error:', todayError)
        const todayScans = todayData || []
        setTodayScans(todayScans)

        const todayCalories = todayScans.reduce((sum, s) => sum + (s.calories ?? 0), 0) ?? 0
        const todayProtein = todayScans.reduce((sum, s) => sum + (s.protein ?? 0), 0) ?? 0
        const todayCarbs = todayScans.reduce((sum, s) => sum + (s.carbs ?? 0), 0) ?? 0
        const todayFats = todayScans.reduce((sum, s) => sum + (s.fats ?? 0), 0) ?? 0
        setTodayStats({ calories: todayCalories, protein: todayProtein, carbs: todayCarbs, fats: todayFats })

        const { data: weekData, error: weekError } = await supabase
          .from('food_scans')
          .select('*')
          .eq('user_id', user.id)
          .gte('scanned_at', weekStart.toISOString())
          .order('scanned_at', { ascending: false })

        if (weekError) console.error('Week scans error:', weekError)
        const weeks = weekData || []
        setWeekScans(weeks)
        setWeekCount(weeks.length)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        const label = `${weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })} - ${weekEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}`
        setWeekLabel(label)

        const { data: foodData, error: foodError } = await supabase
          .from('food_scans')
          .select('*')
          .eq('user_id', user.id)
          .order('scanned_at', { ascending: false })
        if (foodError) console.error('Food scans error:', foodError)
        if (foodData) setFoodScans(foodData)

        const { data: dailyLogData, error: dailyLogError } = await supabase
          .from('daily_nutrition_log')
          .select('log_date, scan_count, total_calories, total_protein, total_carbs, total_fats')
          .eq('user_id', user.id)
          .order('log_date', { ascending: false })
        if (dailyLogError) console.error('Daily nutrition log error:', dailyLogError)
        if (dailyLogData) setDailyLogs(dailyLogData)

        const { data: bodyData, error: bodyError } = await supabase
          .from('body_scans')
          .select('*')
          .eq('user_id', user.id)
          .order('scanned_at', { ascending: false })
          .limit(1)

        if (bodyError) console.error('Body scan error:', bodyError)
        if (bodyData && bodyData.length > 0) setBodyScan(bodyData[0])

        const { data: planData, error: planError } = await supabase
          .from('workout_plans')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (planError) console.error('Workout plan error:', planError)
        const hasPlan = Array.isArray(planData) && planData.length > 0
        setHasWorkoutPlan(hasPlan)

        const istDateKey = (iso: string) =>
          new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date(iso))

        const todayDate = istDateKey(new Date().toISOString())
        const yesterdayDate = istDateKey(new Date(Date.now() - 86400000).toISOString())

        const { data: fuelData, error: fuelError } = await supabase
          .from('fuel_scores')
          .select('score_date, fuel_score')
          .eq('user_id', user.id)
          .in('score_date', [todayDate, yesterdayDate])

        if (fuelError) console.error('Fuel scores error:', fuelError)
        const todayFuel = fuelData?.find((r) => r.score_date === todayDate)?.fuel_score ?? null
        const yesterdayFuel = fuelData?.find((r) => r.score_date === yesterdayDate)?.fuel_score ?? null
        setTodayFuelScore(todayFuel)
        setYesterdayFuelScore(yesterdayFuel)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // ✅ Compute streak using the new function that relies only on food_scans
  const streak = calculateStreakFromScans(foodScans, todayScans.length > 0)

  // We still keep dailyLogs for other uses (like history), but not for streak.

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-foreground mb-2'>Complete your profile</h2>
          <p className='text-muted-foreground'>Please set up your profile to start tracking your fitness journey.</p>
        </div>
      </div>
    )
  }

  const calPercent = profile.calorie_goal
    ? Math.round((todayStats.calories / profile.calorie_goal) * 100)
    : 0
  const proteinPercent = profile.protein_goal
    ? Math.round((todayStats.protein / profile.protein_goal) * 100)
    : 0
  const carbsPercent = profile.carbs_goal
    ? Math.round((todayStats.carbs / profile.carbs_goal) * 100)
    : 0
  const fatsPercent = profile.fat_goal
    ? Math.round((todayStats.fats / profile.fat_goal) * 100)
    : 0

  const initials = (profile.name || displayName)
    .split(' ')
    .map((n: string) => n[0])
    .join('') || ''

  const scannedToday = todayScans.length > 0

  return (
    <div className='mx-auto max-w-2xl w-full px-4 py-6 pb-24'>
      {/* Header – No gym branding */}
      <div className='mb-8 flex items-start justify-between gap-3'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Welcome, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Today's fitness overview
          </p>
        </div>
        <button
          onClick={() => setShowScanner(true)}
          aria-label="Scan gym attendance QR"
          className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card text-primary transition-colors hover:bg-primary/10'
        >
          <ScanLine className='h-5 w-5' />
        </button>
      </div>

      {/* Streak Strip */}
      <div className='flex items-center gap-2 mb-3 text-sm'>
        <Flame className={`h-4 w-4 flex-shrink-0 ${todayScans.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
        <span className='font-semibold text-foreground'>
          {streak} day{streak === 1 ? '' : 's'} streak
        </span>
        {streak > 0 && !scannedToday && (
          <Badge
            className='rounded-full border-0 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-500'
            variant='secondary'
          >
            At risk
          </Badge>
        )}
      </div>

      {/* Today's Workout Card - First */}
      <TodayWorkoutCard
        userId={user?.id ?? ''}
        onCreatePlan={() => setShowPlanner(true)}
      />

      {/* Main Arc Calorie Gauge Card */}
      <Card className='rounded-2xl border-border/50 mb-6 bg-gradient-to-br from-card to-card/80'>
        <CardContent className='p-8'>
          <div className='flex flex-col items-center'>
            <p className='text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6'>
              Calorie Summary
            </p>
            
            {/* Arc Gauge SVG */}
            <svg viewBox='0 0 200 120' className='w-full max-w-sm mb-6' style={{ height: 'auto' }}>
              <path
                d='M 20 100 A 80 80 0 0 1 180 100'
                stroke='currentColor'
                strokeWidth='8'
                fill='none'
                className='text-muted/20'
                strokeLinecap='round'
              />
              <path
                d='M 20 100 A 80 80 0 0 1 180 100'
                stroke='#00ff88'
                strokeWidth='8'
                fill='none'
                strokeDasharray={`${(calPercent / 100) * 251.33} 251.33`}
                strokeLinecap='round'
                opacity='0.8'
              />
            </svg>

            <div className='text-center'>
              <div className='text-4xl font-bold text-foreground mb-1'>
                {profile.calorie_goal - todayStats.calories < 0 
                  ? 0 
                  : Math.round(profile.calorie_goal - todayStats.calories)}
              </div>
              <p className='text-xs text-muted-foreground mb-4'>
                kcal left ({todayStats.calories} of {profile.calorie_goal})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macro Chips - Grid */}
      <div className='grid grid-cols-3 gap-3 mb-6'>
        <MacroChip 
          label='Protein' 
          current={Math.round(todayStats.protein)} 
          goal={profile.protein_goal}
          icon={Target}
          color='#3b82f6'
        />
        <MacroChip 
          label='Carbs' 
          current={Math.round(todayStats.carbs)} 
          goal={profile.carbs_goal ?? 0}
          icon={Flame}
          color='#f59e0b'
        />
        <MacroChip 
          label='Fats' 
          current={Math.round(todayStats.fats)} 
          goal={profile.fat_goal ?? 0}
          icon={Activity}
          color='#ec4899'
        />
      </div>

      {/* Body Stats and Fuel Score Row */}
      <div className='grid grid-cols-2 gap-3 mb-6'>
        <Card className='rounded-2xl border-border/50'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <Activity className='h-4 w-4 text-primary' />
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Body</span>
            </div>
            {bodyScan?.body_fat != null ? (
              <div className='flex items-baseline gap-1'>
                <span className='text-2xl font-bold text-foreground'>{bodyScan.body_fat}%</span>
                <span className='text-xs text-muted-foreground'>fat</span>
              </div>
            ) : (
              <span className='text-sm text-muted-foreground'>No scan yet</span>
            )}
            {bodyScan?.body_type && (
              <Badge
                className='rounded-full border-0 bg-primary/10 px-2 py-0.5 text-[10px] text-primary mt-2'
                variant='secondary'
              >
                {bodyScan.body_type}
              </Badge>
            )}
          </CardContent>
        </Card>

        <FuelScoreCard
          todayScore={todayFuelScore}
          yesterdayScore={yesterdayFuelScore}
          hasMealsLogged={todayScans.length > 0}
        />
      </div>

      {/* Action Button */}
      <button
        onClick={() => setShowLogMeal(true)}
        className='w-full mb-6 py-3 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#00ff88]/30 transition-all'
      >
        <Plus className='h-5 w-5' />
        Log a Meal
      </button>

      {/* Today's Meals List */}
      {todayScans.length > 0 && (
        <Card className='rounded-2xl border-border/50 mb-6'>
          <CardContent className='p-0'>
            <div className='px-4 pt-4 pb-2'>
              <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Today&apos;s Meals</p>
            </div>
            <div className='divide-y divide-border/50'>
              {todayScans.map((scan) => {
                const raw = scan.health_score ?? 0
                const score = normalizeScore(raw)
                const color = getScoreColor(score)
                return (
                  <div
                    key={scan.id ?? scan.scanned_at}
                    className='p-4 hover:bg-muted/30 transition-colors'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex-1'>
                        <p className='font-semibold text-sm text-foreground mb-1'>
                          {scan.food_name || 'Food Scan'}
                        </p>
                        <div className='flex items-center gap-2'>
                          <Clock className='h-3 w-3 text-muted-foreground' />
                          <span className='text-xs text-muted-foreground'>
                            {formatIST(scan.scanned_at, true)}
                          </span>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-sm font-semibold text-foreground mb-1'>
                          {scan.calories ?? 0} kcal
                        </div>
                        <div className='inline-flex items-center gap-1 px-2 py-1 rounded-lg' style={{ background: `${color}15` }}>
                          <span className='text-xs font-semibold' style={{ color }}>
                            {Math.round(score)}/10
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='flex gap-2 mt-2'>
                      {[
                        { label: 'P', value: Math.round(scan.protein) },
                        { label: 'C', value: Math.round(scan.carbs) },
                        { label: 'F', value: Math.round(scan.fats) },
                      ].map((macro) => (
                        <Badge key={macro.label} variant='secondary' className='text-xs'>
                          {macro.label} {macro.value}g
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {todayScans.length === 0 && (
        <Card className='rounded-2xl border-border/50 mb-6'>
          <CardContent className='p-8 text-center'>
            <Utensils className='h-8 w-8 text-muted-foreground/30 mx-auto mb-3 opacity-30' />
            <p className='text-sm text-muted-foreground'>No meals scanned today</p>
            <p className='text-xs text-muted-foreground mt-1'>Start by logging your first meal</p>
          </CardContent>
        </Card>
      )}

      {showPlanner && (
        <div className="fixed inset-0 z-[10000] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-4">
          <div className="w-full max-w-lg sm:rounded-2xl rounded-none sm:max-h-[90vh] max-h-screen overflow-y-auto bg-background border border-border">
            <WorkoutPlannerForm
              userId={user?.id ?? ''}
              existingBodyFat={bodyScan?.body_fat_percent}
              onComplete={() => {
                setShowPlanner(false)
                window.location.reload()
              }}
            />
          </div>
        </div>
      )}

      <LogMealDialog
        open={showLogMeal}
        onOpenChange={setShowLogMeal}
        onMealSaved={refetchData}
      />

      <QrScannerDialog
        open={showScanner}
        onOpenChange={setShowScanner}
        userId={user?.id ?? ''}
      />

      <AccessRevokedModal open={accessRevoked} />
    </div>
  )
}

function MacroChip({
  label,
  current,
  goal,
  icon: Icon,
  color,
}: {
  label: string
  current: number
  goal: number
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  color: string
}) {
  const percent = goal > 0 ? Math.round((current / goal) * 100) : 0

  return (
    <Card className='rounded-2xl border-border/50'>
      <CardContent className='p-3'>
        <div className='flex items-center justify-between mb-2'>
          <div style={{ color }} className='opacity-80'>
            <Icon size={18} strokeWidth={2} />
          </div>
          <span className='text-xs font-semibold text-muted-foreground'>{label}</span>
        </div>
        <div className='mb-2'>
          <p className='text-lg font-bold text-foreground'>
            {current}
            <span className='text-xs text-muted-foreground ml-0.5'>g</span>
          </p>
          <p className='text-xs text-muted-foreground'>of {goal}g</p>
        </div>
        <Progress value={Math.min(percent, 100)} className='h-1.5' />
      </CardContent>
    </Card>
  )
}
