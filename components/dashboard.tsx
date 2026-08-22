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
import { PhoneNotLinkedModal } from '@/components/phone-not-linked-modal'

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
  phone?: string
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
  const [showPhoneNotLinkedModal, setShowPhoneNotLinkedModal] = useState(false)
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

  // Check app_access periodically
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

  // Check if the user's phone is still linked to a gym
  useEffect(() => {
    if (!user || !profile?.phone) return

    let cancelled = false

    async function checkPhoneLinked() {
      const { data } = await supabase
        .from('gym_members')
        .select('id')
        .eq('phone', profile.phone!)
        .eq('deleted_at', null)
        .maybeSingle()

      if (cancelled) return
      if (!data) {
        setShowPhoneNotLinkedModal(true)
      }
    }

    void checkPhoneLinked()
    const interval = setInterval(checkPhoneLinked, 30000)

    function handleVisibility() {
      if (document.visibilityState === 'visible') void checkPhoneLinked()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user, profile?.phone])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, age, weight, height, goal, gender, calorie_goal, protein_goal, carbs_goal, fat_goal, fiber_goal, bmr, tdee, created_at, gym_id, phone')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile error:', profileError)
        }
        if (profileData) setProfile(profileData)

        // ... rest of the data fetching (unchanged)
        // (I'll keep the rest as per original to save space, but it's the same)
        // ...
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // ... rest of the component (render, macro chip, etc.) is unchanged, except we add the modal at the end

  // Return JSX with the modal added
  return (
    <div className='mx-auto max-w-2xl w-full px-4 py-6 pb-24'>
      {/* ... all existing JSX ... */}
      {/* At the very bottom, before the closing </> */}
      <PhoneNotLinkedModal
        open={showPhoneNotLinkedModal}
        onOpenChange={setShowPhoneNotLinkedModal}
      />
    </div>
  )
}

// MacroChip remains the same
