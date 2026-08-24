import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// Default fallback icons – ensure installability even without a gym logo
const defaultIcons = [
  {
    src: '/logo-192.png', // You need to have this file in your public folder
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: '/logo-512.png', // You need to have this file in your public folder
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any maskable',
  },
]

export async function GET(_req: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
  const { gymId } = await params

  // Default branding (used if gym not found or no custom branding exists)
  let gymName = 'GainAi'
  let brandColor = '#00ff88'
  let logoUrl: string | null = null

  try {
    const { data, error } = await supabase.rpc('get_gym_branding_by_id', { p_gym_id: gymId })
    const gym = Array.isArray(data) ? data[0] : data

    if (!error && gym) {
      gymName = gym.gym_name || 'GainAi'
      brandColor = gym.brand_color || '#00ff88'
      logoUrl = gym.logo_url || null
    }
  } catch (err) {
    // If RPC fails, fall back to default branding – no error response
    console.warn('Failed to fetch gym branding, using default:', err)
  }

  // Build icons array – include fallback icons always, plus gym logo if available
  const icons = [...defaultIcons]
  if (logoUrl) {
    const iconType = logoUrl.toLowerCase().includes('.jpg') || logoUrl.toLowerCase().includes('.jpeg')
      ? 'image/jpeg'
      : 'image/png'
    // Add the gym logo as the primary icon (replace the default one for 192x192)
    icons.unshift({
      src: logoUrl,
      sizes: '192x192',
      type: iconType,
    })
    // Also add 512x512 version if possible (use same logo, browser handles scaling)
    icons.unshift({
      src: logoUrl,
      sizes: '512x512',
      type: iconType,
      purpose: 'any maskable',
    })
  }

  const manifest = {
    name: `${gymName} · GainAi`,
    short_name: gymName,
    description: `${gymName} member app, powered by GainAi`,
    start_url: '/',
    display: 'standalone',
    background_color: brandColor,
    theme_color: brandColor,
    orientation: 'portrait',
    icons,
  }

  return Response.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
