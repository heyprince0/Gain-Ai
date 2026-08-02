'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from 'next-themes'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { User, Target, Moon, Sun, Dumbbell, Loader2, CalendarDays } from 'lucide-react'
import { WorkoutPlannerForm } from '@/components/workout-planner-form'

const cleanName = (name: string) => name.replace(/\s[A-C]$/i, '').trim()
const dayAbbreviations = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
}

interface WorkoutProfile {
  fitness_goal?: string
  secondary_goal?: string
  experience_level?: string
  days_per_week?: number
  athlete_type?: string
  body_fat_percent?: number
}

export function ProfileContent() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [workoutProfile, setWorkoutProfile] = useState<WorkoutProfile | null>(null)
  const [weeklyPlan, setWeeklyPlan] = useState<any>(null)
  const [showPlanner, setShowPlanner] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    goal: 'maintain',
    gender: '',
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile error:', profileError)
        }

        if (profileData) {
          setProfile(profileData)
          setForm({
            name: profileData.name || '',
            age: profileData.age?.toString() || '',
            weight: profileData.weight?.toString() || '',
            height: profileData.height?.toString() || '',
            goal: profileData.goal || 'maintain',
            gender: profileData.gender || '',
          })
        }

        // Fetch workout profile
        const { data: workoutData } = await supabase
          .from('workout_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (workoutData) {
          setWorkoutProfile(workoutData)
        }

        // Fetch latest weekly workout plan
        const { data: planData, error: planError } = await supabase
          .from('workout_plans')
          .select('plan')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (planError && planError.code !== 'PGRST116') {
          console.error('Error fetching weekly plan:', planError)
        }
        if (planData) {
          setWeeklyPlan(planData.plan)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const calculateGoals = (age: number, weight: number, height: number, goal: string, gender: string) => {
    const bmrConstant = gender === 'Male' ? 5 : -161
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + bmrConstant
    const tdee = Math.round(bmr * 1.55)
    let calories = goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 300 : tdee
    const protein = Math.round(weight * (goal === 'gain' ? 2.2 : goal === 'lose' ? 2.0 : 1.8))
    const fat = Math.round((calories * 0.25) / 9)
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)
    const fiber = Math.round((calories / 1000) * 14)
    return {
      calorie_goal: calories,
      protein_goal: protein,
      carbs_goal: Math.max(carbs, 50),
      fat_goal: fat,
      fiber_goal: fiber,
      bmr: Math.round(bmr),
      tdee,
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const age = parseInt(form.age)
      const weight = parseFloat(form.weight)
      const height = parseFloat(form.height)

      if (!age || !weight || !height) {
        setError('Please fill in all fields')
        setSaving(false)
        return
      }

      const goals = calculateGoals(age, weight, height, form.goal, form.gender)

      const { error: err } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          name: form.name,
          age,
          weight,
          height,
          goal: form.goal,
          gender: form.gender || null,
          ...goals,
        }, { onConflict: 'id' })

      if (err) throw err

      setProfile({
        ...profile!,
        name: form.name,
        age,
        weight,
        height,
        goal: form.goal,
        gender: form.gender,
        ...goals,
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

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
          Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal info and fitness goals
        </p>
      </div>

      {/* Personal Info Card */}
      <Card className='rounded-2xl border-border/50 mb-6'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-2 mb-6'>
            <User className='h-5 w-5 text-primary' />
            <h2 className='text-lg font-semibold text-foreground'>Personal Information</h2>
          </div>

          <form onSubmit={handleSave} className='space-y-4'>
            {/* Name */}
            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>Full Name</label>
              <input
                type='text'
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className='w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all'
                placeholder='Your name'
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className='w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all'
                required
              >
                <option value=''>Select gender</option>
                <option value='Male'>Male</option>
                <option value='Female'>Female</option>
                <option value='Other'>Other</option>
              </select>
            </div>

            {/* Age, Weight, Height */}
            <div className='grid grid-cols-3 gap-3'>
              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>Age</label>
                <input
                  type='number'
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className='w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all'
                  min='13'
                  max='120'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>Weight (kg)</label>
                <input
                  type='number'
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className='w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all'
                  min='30'
                  step='0.1'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>Height (cm)</label>
                <input
                  type='number'
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  className='w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all'
                  min='100'
                  max='250'
                  required
                />
              </div>
            </div>

            {/* Fitness Goal */}
            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>Fitness Goal</label>
              <select
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                className='w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all'
                required
              >
                <option value='lose'>Lose Weight</option>
                <option value='maintain'>Maintain Weight</option>
                <option value='gain'>Gain Muscle</option>
              </select>
            </div>

            {/* Messages */}
            {error && (
              <div className='rounded-xl border border-red-500/30 bg-red-500/10 p-3'>
                <p className='text-xs text-red-600 font-medium'>{error}</p>
              </div>
            )}
            {success && (
              <div className='rounded-xl border border-primary/30 bg-primary/10 p-3'>
                <p className='text-xs text-primary font-medium'>Profile updated successfully!</p>
              </div>
            )}

            <Button
              type='submit'
              disabled={saving}
              className='w-full rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold hover:shadow-lg hover:shadow-[#00ff88]/30'
            >
              {saving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Goals Card */}
      {profile && (
        <Card className='rounded-2xl border-border/50 mb-6'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-2 mb-6'>
              <Target className='h-5 w-5 text-primary' />
              <h2 className='text-lg font-semibold text-foreground'>Daily Goals</h2>
            </div>

            <div className='space-y-3'>
              {[
                { icon: '🔥', label: 'Daily Calories', value: `${profile.calorie_goal} kcal` },
                { icon: '🥩', label: 'Protein', value: `${profile.protein_goal}g` },
                { icon: '🍞', label: 'Carbs', value: `${profile.carbs_goal ?? 0}g` },
                { icon: '🧈', label: 'Fats', value: `${profile.fat_goal ?? 0}g` },
                { icon: '🌾', label: 'Fiber', value: `${profile.fiber_goal ?? 0}g` },
              ].map((goal) => (
                <div key={goal.label} className='flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors'>
                  <span className='text-sm font-medium text-foreground'>{goal.label}</span>
                  <span className='text-lg font-bold text-primary'>{goal.value}</span>
                </div>
              ))}
            </div>

            {profile.bmr && profile.tdee && (
              <div className='mt-6 pt-6 border-t border-border/50 space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>BMR (Basal Metabolic Rate)</span>
                  <span className='text-sm font-semibold text-foreground'>{profile.bmr} kcal/day</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>TDEE (Total Daily Energy Expenditure)</span>
                  <span className='text-sm font-semibold text-foreground'>{profile.tdee} kcal/day</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Workout Profile Card */}
      {workoutProfile && (
        <Card className='rounded-2xl border-border/50 mb-6'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-2 mb-6'>
              <Dumbbell className='h-5 w-5 text-primary' />
              <h2 className='text-lg font-semibold text-foreground'>Workout Profile</h2>
            </div>

            <div className='space-y-3'>
              {workoutProfile.fitness_goal && (
                <div className='flex items-center justify-between p-3 rounded-xl bg-muted/30'>
                  <span className='text-sm font-medium text-foreground'>Fitness Goal</span>
                  <span className='text-sm font-semibold text-primary'>{workoutProfile.fitness_goal}</span>
                </div>
              )}
              {workoutProfile.experience_level && (
                <div className='flex items-center justify-between p-3 rounded-xl bg-muted/30'>
                  <span className='text-sm font-medium text-foreground'>Experience Level</span>
                  <span className='text-sm font-semibold text-primary'>{workoutProfile.experience_level}</span>
                </div>
              )}
              {workoutProfile.days_per_week && (
                <div className='flex items-center justify-between p-3 rounded-xl bg-muted/30'>
                  <span className='text-sm font-medium text-foreground'>Days Per Week</span>
                  <span className='text-sm font-semibold text-primary'>{workoutProfile.days_per_week} days</span>
                </div>
              )}
              {workoutProfile.athlete_type && (
                <div className='flex items-center justify-between p-3 rounded-xl bg-muted/30'>
                  <span className='text-sm font-medium text-foreground'>Athlete Type</span>
                  <span className='text-sm font-semibold text-primary'>{workoutProfile.athlete_type}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Workout Plan Card */}
      <Card className='rounded-2xl border-border/50 mb-6'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-2 mb-6'>
            <CalendarDays className='h-5 w-5 text-primary' />
            <h2 className='text-lg font-semibold text-foreground'>Your Weekly Plan</h2>
          </div>

          {weeklyPlan && weeklyPlan.days && (
            <div className='mb-4 space-y-3'>
              {dayAbbreviations.map((dayAbbr, idx) => {
                const dayNumber = idx + 1 // Mon=1, Tue=2, ..., Sun=7
                const workoutDay = weeklyPlan.days.find((d: any) => d.day_number === dayNumber)
                return (
                  <div
                    key={dayAbbr}
                    className='flex items-center justify-between p-3 rounded-xl bg-muted/30'
                  >
                    <span className='text-sm font-medium text-foreground'>{dayAbbr}</span>
                    <span className={`text-sm font-semibold ${workoutDay ? 'text-primary' : 'text-muted-foreground'}`}>
                      {workoutDay ? cleanName(workoutDay.focus) : 'Rest'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <p className='mb-4 text-xs text-muted-foreground'>
            {weeklyPlan
              ? 'Create a new AI-generated workout plan based on your current profile and goals.'
              : "Let AI build your personalized weekly workout plan."}
          </p>

          <Button
            onClick={() => setShowPlanner(true)}
            className='w-full rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold hover:shadow-lg hover:shadow-[#00ff88]/30'
          >
            {weeklyPlan ? 'Regenerate Workout Plan ✨' : 'Create Workout Plan ✨'}
          </Button>
        </CardContent>
      </Card>

      {/* Theme Toggle Card */}
      <Card className='rounded-2xl border-border/50'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {theme === 'dark' ? (
                <Moon className='h-5 w-5 text-primary' />
              ) : (
                <Sun className='h-5 w-5 text-primary' />
              )}
              <div>
                <h3 className='text-sm font-semibold text-foreground'>Dark Mode</h3>
                <p className='text-xs text-muted-foreground'>Toggle dark theme</p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              className='h-6 w-11'
            />
          </div>
        </CardContent>
      </Card>

      {showPlanner && user && (
        <div className='fixed inset-0 z-[10000] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-4'>
          <div className='w-full max-w-lg sm:rounded-2xl rounded-none sm:max-h-[90vh] max-h-screen overflow-y-auto bg-background border border-border'>
            <WorkoutPlannerForm
              userId={user.id}
              existingBodyFat={workoutProfile?.body_fat_percent}
              onComplete={() => {
                setShowPlanner(false)
                window.location.reload()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
