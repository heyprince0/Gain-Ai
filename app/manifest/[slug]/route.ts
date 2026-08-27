import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

const FALLBACK_ICON = '/logo.png'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data, error } = await supabase.from('gyms').select('gym_name, slug, logo_url, primary_color').eq('slug', slug).maybeSingle()
  if (error || !data) return Response.json({ error: 'Gym not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })

  const icon = data.logo_url || FALLBACK_ICON
  return Response.json({
    name: data.gym_name,
    short_name: data.gym_name.slice(0, 12),
    id: `/g/${data.slug}`,                    // ✅ Keep this for identification
    start_url: '/dashboard',                  // 🔥 CHANGED: Start directly on the dashboard
    scope: '/',                               // 🔥 CHANGED: Cover EVERY route in the app
    display: 'standalone',
    background_color: '#0f1318',
    theme_color: data.primary_color || '#00ff88',
    icons: [
      { src: icon, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: icon, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }, { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-store, max-age=0' } })
}
