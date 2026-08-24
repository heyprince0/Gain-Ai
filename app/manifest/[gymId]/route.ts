import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
  const { gymId } = await params
  const { data, error } = await supabase.rpc('get_gym_branding_by_id', { p_gym_id: gymId })
  const gym = Array.isArray(data) ? data[0] : data

  if (error || !gym) {
    return Response.json({ error: 'Gym not found' }, { status: 404 })
  }

  const name = gym.gym_name || 'GainAi'
  const brandColor = gym.brand_color || '#00ff88'
  const iconType = gym.logo_url?.toLowerCase().includes('.jpg') || gym.logo_url?.toLowerCase().includes('.jpeg')
    ? 'image/jpeg'
    : 'image/png'

  return Response.json({
    name: `${name} · GainAi`,
    short_name: name,
    description: `${name} member app, powered by GainAi`,
    start_url: '/',
    display: 'standalone',
    background_color: brandColor,
    theme_color: brandColor,
    orientation: 'portrait',
    icons: gym.logo_url ? [{ src: gym.logo_url, sizes: '192x192', type: iconType }] : [],
  }, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
