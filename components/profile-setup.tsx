'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { PhoneNotLinkedModal } from '@/components/phone-not-linked-modal'

interface ProfileFormData {
  fullName: string
  phone: string
  age: number
  weight: number
  goal: 'lose' | 'maintain' | 'gain'
  gender: string
}

function calculateGoals(age: number, weight: number, height: number, goal: string, gender: string) {
  const bmrConstant = gender === 'Male' ? 5 : -161
  const bmr = 10 * weight + 6.25 * height - 5 * age + bmrConstant
  const tdee = Math.round(bmr * 1.55)

  let calories: number
  if (goal === 'lose') {
    calories = tdee - 500
  } else if (goal === 'gain') {
    calories = tdee + 300
  } else {
    calories = tdee
  }

  const protein = Math.round(weight * (goal === 'gain' ? 2.2 : goal === 'lose' ? 2.0 : 1.8))
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)
  const fiber = Math.round((calories / 1000) * 14)

  return {
    bmr: Math.round(bmr),
    tdee,
    calorie_goal: calories,
    protein_goal: protein,
    carbs_goal: Math.max(carbs, 50),
    fat_goal: fat,
    fiber_goal: fiber,
  }
}

export function ProfileSetup() {
  const { user, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPhoneNotLinkedModal, setShowPhoneNotLinkedModal] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    phone: '',
    age: 25,
    weight: 70,
    goal: 'maintain',
    gender: '',
  })
  const [height, setHeight] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) throw new Error('User not authenticated')

      // --- Check if phone number exists in gym_members ---
      const { data: memberData, error: memberError } = await supabase
        .from('gym_members')
        .select('id, linked_profile_id')
        .eq('phone', formData.phone)
        .eq('deleted_at', null)
        .maybeSingle()

      if (memberError) {
        console.error('Error checking gym membership:', memberError)
        setError('Unable to verify gym membership. Please try again.')
        setLoading(false)
        return
      }

      if (!memberData) {
        // Phone number not found in any gym
        setShowPhoneNotLinkedModal(true)
        setLoading(false)
        return
      }

      // Phone number exists, but might already be linked to another profile
      if (memberData.linked_profile_id && memberData.linked_profile_id !== user.id) {
        setError('This phone number is already linked to another account.')
        setLoading(false)
        return
      }

      // Phone is valid — proceed with profile creation
      const heightInCm = parseFloat(height)
      const goals = calculateGoals(formData.age, formData.weight, heightInCm, formData.goal, formData.gender)

      const { error: err } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            name: formData.fullName,
            phone: formData.phone || null,
            age: parseInt(formData.age.toString()),
            weight: parseFloat(formData.weight.toString()),
            height: heightInCm,
            goal: formData.goal,
            gender: formData.gender || null,
            bmr: goals.bmr,
            tdee: goals.tdee,
            calorie_goal: goals.calorie_goal,
            protein_goal: goals.protein_goal,
            carbs_goal: goals.carbs_goal,
            fat_goal: goals.fat_goal,
            fiber_goal: goals.fiber_goal,
          },
          { onConflict: 'id' }
        )

      if (err) throw err

      // --- Link the profile to the gym member record ---
      if (memberData && !memberData.linked_profile_id) {
        await supabase
          .from('gym_members')
          .update({ linked_profile_id: user.id })
          .eq('id', memberData.id)
      }

      await refreshProfile()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to setup profile'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4'>
      <Card className='w-full max-w-md border-border/50'>
        <CardHeader className='space-y-2 text-center'>
          <CardTitle className='text-2xl'>Complete Your Profile</CardTitle>
          <CardDescription>Help us personalize your fitness journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-foreground mb-1'>Full Name</label>
              <input
                type='text'
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:border-primary focus:outline-none'
                placeholder='Your name'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground mb-1'>Phone Number</label>
              <input
                type='tel'
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:border-primary focus:outline-none'
                placeholder='e.g. 9876543210'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground mb-1'>Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
              >
                <option value=''>Select gender</option>
                <option value='Male'>Male</option>
                <option value='Female'>Female</option>
                <option value='Other'>Other</option>
              </select>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-sm font-medium text-foreground mb-1'>Age</label>
                <input
                  type='number'
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                  min='13'
                  max='120'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground mb-1'>Weight (kg)</label>
                <input
                  type='number'
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                  min='30'
                  step='0.1'
                  required
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground mb-1'>Height (cm)</label>
              <input
                type='number'
                placeholder='Height in cm (e.g. 175)'
                min='100'
                max='250'
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground mb-1'>Fitness Goal</label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
                className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                required
              >
                <option value='lose'>Lose Weight</option>
                <option value='maintain'>Maintain Weight</option>
                <option value='gain'>Gain Muscle</option>
              </select>
            </div>

            {error && (
              <div className='rounded-lg border border-red-500/50 bg-red-500/5 p-3'>
                <p className='text-sm text-red-600'>{error}</p>
              </div>
            )}

            <Button type='submit' disabled={loading} className='w-full rounded-lg'>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PhoneNotLinkedModal
        open={showPhoneNotLinkedModal}
        onOpenChange={setShowPhoneNotLinkedModal}
      />
    </div>
  )
}
