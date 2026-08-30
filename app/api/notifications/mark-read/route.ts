import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const verifyClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { notification_id } = await request.json()
    if (!notification_id) return NextResponse.json({ error: 'notification_id is required' }, { status: 400 })

    // ✅ Service role for DB query + manual user check via .eq('member_id', user.id)
    const { error } = await getServiceSupabase()
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification_id)
      .eq('member_id', user.id) // security: only mark own notifications

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications/mark-read]', error)
    return NextResponse.json({ error: 'Unable to mark notification as read' }, { status: 500 })
  }
}
