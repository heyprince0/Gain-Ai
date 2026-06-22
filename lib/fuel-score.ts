import { supabase } from '@/lib/supabase'

interface Profile {
  calorie_goal: number
  protein_goal: number
  carbs_goal?: number
  fat_goal?: number
}

interface FoodScan {
  calories: number
  protein: number
  carbs: number
  fats: number
  health_score?: number
  scanned_at: string
}

export const saveFuelScore = async (
  userId: string,
  profile: Profile,
  updatedTodayScans: FoodScan[]
) => {
  const istDateKey = (iso: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso))

  const scoreDate = istDateKey(new Date().toISOString())

  // Only meals that have a health score
  const scansWithScore = updatedTodayScans.filter(
    (s) => s.health_score != null && s.health_score > 0
  )

  // Average meal quality (0-10)
  const avgMealScore =
    scansWithScore.length > 0
      ? scansWithScore.reduce((sum, meal) => {
          const score =
            (meal.health_score ?? 0) > 10
              ? (meal.health_score ?? 0) / 10
              : (meal.health_score ?? 0)

          return sum + score
        }, 0) / scansWithScore.length
      : null

  // Final Diet Accuracy (0-100)
  const fuelScore =
    avgMealScore !== null
      ? Math.round(avgMealScore * 10)
      : 0

  await supabase.from('fuel_scores').upsert(
    {
      user_id: userId,
      score_date: scoreDate,

      fuel_score: fuelScore,

      calorie_score: 0,
      protein_score: 0,
      carbs_score: 0,
      fats_score: 0,

      quality_score:
        avgMealScore !== null
          ? Math.round((avgMealScore / 10) * 100)
          : 0,

      total_calories: updatedTodayScans.reduce(
        (sum, meal) => sum + (meal.calories ?? 0),
        0
      ),

      total_protein: updatedTodayScans.reduce(
        (sum, meal) => sum + (meal.protein ?? 0),
        0
      ),

      total_carbs: updatedTodayScans.reduce(
        (sum, meal) => sum + (meal.carbs ?? 0),
        0
      ),

      total_fats: updatedTodayScans.reduce(
        (sum, meal) => sum + (meal.fats ?? 0),
        0
      ),

      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,score_date',
    }
  )
}
