import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

interface GymManifestData {
  gym_name: string
  logo_url: string | null
  primary_color: string | null
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data, error } = await supabase
    .from('gyms')
    .select('gym_name, logo_url, primary_color')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    return Response.json({ error: 'Gym not found' }, { status: 404 })
  }

  const gym = data as GymManifestData
  const themeColor = gym.primary_color || '#00ff88'
  const icons = gym.logo_url
    ? [
        { src: gym.logo_url, sizes: '192x192', type: 'image/png' },
        { src: gym.logo_url, sizes: '512x512', type: 'image/png' },
      ]
    : []

  return Response.json(
    {
      name: gym.gym_name,
      short_name: gym.gym_name.slice(0, 12),
      start_url: `/g/${slug}?source=pwa`,
      scope: `/g/${slug}`,
      display: 'standalone',
      background_color: '#0f1318',
      theme_color: themeColor,
      icons,
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  )
}
