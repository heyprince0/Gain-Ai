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
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(iso))

  const scoreDate = istDateKey(new Date().toISOString())

  // ── Step 1: Fetch yesterday's score ───────────────────────
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayDate = istDateKey(yesterday.toISOString())

  const { data: yesterdayRow } = await supabase
    .from('fuel_scores')
    .select('fuel_score')
    .eq('user_id', userId)
    .eq('score_date', yesterdayDate)
    .single()

  const baseScore = yesterdayRow?.fuel_score ?? 50

  // ── Step 2: Calculate average meal quality ────────────────
  const scansWithScore = updatedTodayScans.filter(
    s => s.health_score != null && s.health_score > 0
  )

  const avgMealScore = scansWithScore.length > 0
    ? scansWithScore.reduce((s, x) => {
        const n = (x.health_score ?? 0) > 10
          ? (x.health_score ?? 0) / 10
          : (x.health_score ?? 0)
        return s + n
      }, 0) / scansWithScore.length
    : null

  // ── Step 3: Strict effect tiers ───────────────────────────
  // No meals logged = no change to score
  // Must consistently eat 8-9/10 to reach 90%+
  let todayEffect = 0
  if (avgMealScore !== null) {
    todayEffect = Math.round(((avgMealScore - 5) / 5) * 15)
  }

  // ── Step 4: Final score clamped 0-100 ─────────────────────
  const fuelScore = Math.min(100, Math.max(0, baseScore + todayEffect))

  // ── Step 5: Save ──────────────────────────────────────────
  await supabase.from('fuel_scores').upsert({
    user_id: userId,
    score_date: scoreDate,
    fuel_score: fuelScore,
    calorie_score: 0,
    protein_score: 0,
    carbs_score: 0,
    fats_score: 0,
    quality_score: avgMealScore ? (avgMealScore / 10) * 100 : 0,
    total_calories: updatedTodayScans.reduce((s, x) => s + (x.calories ?? 0), 0),
    total_protein: updatedTodayScans.reduce((s, x) => s + (x.protein ?? 0), 0),
    total_carbs: updatedTodayScans.reduce((s, x) => s + (x.carbs ?? 0), 0),
    total_fats: updatedTodayScans.reduce((s, x) => s + (x.fats ?? 0), 0),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,score_date' })
}
