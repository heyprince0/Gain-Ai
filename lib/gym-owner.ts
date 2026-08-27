import { supabase } from '@/lib/supabase'

export type Gym = { id: string; gym_name: string; slug: string; logo_url: string | null; primary_color: string | null; owner_name: string; owner_phone: string; address: string; city_area: string | null }
export type Plan = { id: string; gym_id: string; plan_name: string; price: number; duration_days: number; is_active?: boolean }
export type GymMember = { id: string; gym_id: string; linked_profile_id: string | null; name: string; phone: string; address: string; plan_id: string | null; start_date: string; end_date: string; app_access: boolean; deleted_at?: string | null; gym_subscription_plans?: Plan | null }

export async function getOwnerGym(userId: string) {
  const { data, error } = await supabase.from('gyms').select('*').eq('owner_id', userId).maybeSingle()
  if (error) throw error
  return data as Gym | null
}

export function daysUntilEnd(endDate: string) {
  const end = new Date(`${endDate}T23:59:59`)
  return Math.ceil((end.getTime() - Date.now()) / 86400000)
}

export function memberStatus(endDate: string) {
  const days = daysUntilEnd(endDate)
  if (days < 0) return 'Expired'
  if (days <= 7) return 'Expiring soon'
  return 'Active'
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
}

export async function getOwnerData(userId: string) {
  const gym = await getOwnerGym(userId)
  if (!gym) return { gym: null, members: [], plans: [] as Plan[] }
  const [{ data: members, error: membersError }, { data: plans, error: plansError }] = await Promise.all([
    supabase.from('gym_members').select('*, gym_subscription_plans(*)').eq('gym_id', gym.id).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('gym_subscription_plans').select('*').eq('gym_id', gym.id).order('created_at', { ascending: false }),
  ])
  if (membersError) throw membersError
  if (plansError) throw plansError
  return { gym, members: (members ?? []) as GymMember[], plans: (plans ?? []) as Plan[] }
}

export function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + Number(days))
  return next.toISOString().slice(0, 10)
}
