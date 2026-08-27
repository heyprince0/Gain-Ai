import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { InstallButton } from '@/components/install-button'
import { supabase } from '@/lib/supabase'

interface Gym { gym_name: string; slug: string; logo_url: string | null; primary_color: string | null }
interface GymPageProps { params: Promise<{ slug: string }> }

async function getGym(slug: string): Promise<Gym | null> {
  if (!/^[a-z0-9-]+$/i.test(slug)) return null
  const { data, error } = await supabase.from('gyms').select('gym_name, slug, logo_url, primary_color').eq('slug', slug).maybeSingle()
  return error || !data ? null : data as Gym
}

function safeColor(color: string | null) {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#00ff88'
}

export async function generateMetadata({ params }: GymPageProps): Promise<Metadata> {
  const { slug } = await params
  const gym = await getGym(slug)
  if (!gym) return { title: 'Gym app | GainAi' }
  return { title: `${gym.gym_name} | GainAi`, description: `Install the ${gym.gym_name} member app.`, manifest: `/manifest/${gym.slug}`, appleWebApp: { title: gym.gym_name, capable: true, statusBarStyle: 'black-translucent' }, icons: gym.logo_url ? { apple: gym.logo_url } : undefined }
}

export default async function GymInstallPage({ params }: GymPageProps) {
  const { slug } = await params
  const gym = await getGym(slug)
  if (!gym) notFound()
  const accentColor = safeColor(gym.primary_color)
  const initials = gym.gym_name.slice(0, 2).toUpperCase()
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f1318] px-6 py-12 text-white" style={{ '--gym-accent': accentColor } as CSSProperties}>
    <div className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-20" style={{ background: `radial-gradient(circle at 50% 0%, ${accentColor}, transparent 68%)` }} />
    <section className="relative flex w-full max-w-md flex-col items-center gap-7 text-center">
      <div className="flex size-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl" style={{ boxShadow: `0 0 0 1px ${accentColor}33, 0 18px 60px ${accentColor}22` }}>
        {gym.logo_url ? <img src={gym.logo_url} alt={`${gym.gym_name} logo`} className="size-full object-cover" /> : <span className="font-mono text-2xl font-bold" style={{ color: accentColor }}>{initials}</span>}
      </div>
      <div className="flex flex-col gap-2"><p className="font-mono text-[11px] uppercase tracking-[0.28em]" style={{ color: accentColor }}>Member access</p><h1 className="text-balance text-4xl font-semibold tracking-tight">{gym.gym_name}</h1><p className="text-sm leading-6 text-white/55">Powered by GainAi</p></div>
      <div className="flex min-h-14 items-center justify-center"><InstallButton slug={gym.slug} accentColor={accentColor} /></div>
    </section>
  </main>
}
