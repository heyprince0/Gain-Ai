import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: { gymId: string } }) {
  const { data } = await supabase.rpc('get_gym_branding_by_id', { p_gym_id: params.gymId })
  const gym = Array.isArray(data) ? data[0] : data

  const name = gym?.gym_name ? gym.gym_name : 'GainAi'
  const icon = gym?.logo_url || '/logo.png'
  const themeColor = gym?.brand_color || '#00ff88'

  const manifest = {
    name,
    short_name: name,
    description: gym?.gym_name ? `${gym.gym_name} member app, powered by GainAi` : 'AI Powered Fitness App',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f1318',
    theme_color: themeColor,
    orientation: 'portrait',
    icons: [
      { src: icon, sizes: '192x192', type: 'image/png' },
      { src: icon, sizes: '512x512', type: 'image/png' },
    ],
  }

  return Response.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
