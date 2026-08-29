import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { member_id, gym_id, fcm_token, device_type, browser } = body
    if (!member_id || !gym_id || !fcm_token) return NextResponse.json({ error: 'member_id, gym_id, and fcm_token are required' }, { status: 400 })
    if (member_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { error } = await supabase.from('member_push_tokens').upsert({ member_id, gym_id, fcm_token, device_type: device_type || 'web', browser: browser || null, is_active: true, last_used_at: new Date().toISOString() }, { onConflict: 'fcm_token' })
    if (error) throw error
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[notifications/register]', error)
    return NextResponse.json({ error: 'Unable to register notification token' }, { status: 500 })
  }
}
