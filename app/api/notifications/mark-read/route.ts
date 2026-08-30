import { NextResponse } from 'next/server'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { notification_id } = await request.json()
    if (!notification_id) return NextResponse.json({ error: 'notification_id is required' }, { status: 400 })
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notification_id).eq('member_id', user.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications/mark-read]', error)
    return NextResponse.json({ error: 'Unable to mark notification as read' }, { status: 500 })
  }
}
