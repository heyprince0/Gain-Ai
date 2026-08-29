import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data, error } = await supabase.from('notifications').select('*').eq('member_id', user.id).order('sent_at', { ascending: false }).limit(20)
    if (error) throw error
    return NextResponse.json({ notifications: data || [], limit: 20 })
  } catch (error) {
    console.error('[notifications/list]', error)
    return NextResponse.json({ error: 'Unable to load notifications' }, { status: 500 })
  }
}
