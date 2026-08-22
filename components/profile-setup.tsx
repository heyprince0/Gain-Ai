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

      // --- Check if phone number exists using the secure function ---
      const { data: exists, error: checkError } = await supabase.rpc(
        'check_member_phone_exists',
        { p_phone: formData.phone }
      )

      if (checkError) {
        console.error('Error checking gym membership:', checkError)
        setError('Unable to verify gym membership. Please try again.')
        setLoading(false)
        return
      }

      if (!exists) {
        // Phone number not found in any gym
        setShowPhoneNotLinkedModal(true)
        setLoading(false)
        return
      }

      // Phone exists – proceed with profile creation
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

      // --- Link the profile to the gym member record using the secure function ---
      const { data: linked, error: linkError } = await supabase.rpc(
        'link_member_profile',
        { p_phone: formData.phone, p_profile_id: user.id }
      )

      if (linkError) {
        console.error('Error linking profile:', linkError)
        setError('Failed to link your profile. Please contact support.')
        setLoading(false)
        return
      }

      if (!linked) {
        setError('This phone number is already linked to another account or not found.')
        setLoading(false)
        return
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
            {/* ... form fields unchanged ... */}
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
