import { NextResponse } from 'next/server'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { createClient } from '@supabase/supabase-js'

function getAdminMessaging() {
  const adminApp = getApps()[0] || initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON!)) })
  return getMessaging(adminApp)
}

function getServiceSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(request: Request) {
  try {
    const { member_id, gym_id, title, body, type, url } = await request.json()
    if (!member_id || !gym_id || !title || !body) return NextResponse.json({ error: 'member_id, gym_id, title, and body are required' }, { status: 400 })
    const adminMessaging = getAdminMessaging()
    const serviceSupabase = getServiceSupabase()
    const { data: rows, error } = await serviceSupabase.from('member_push_tokens').select('id, fcm_token').eq('member_id', member_id).eq('gym_id', gym_id).eq('is_active', true)
    if (error) throw error
    const responses = rows?.length ? await adminMessaging.sendEach(rows.map((row) => ({ token: row.fcm_token, notification: { title, body }, data: { type: type || 'general', url: url || '/' }, webpush: { fcmOptions: { link: url || '/' } } }))) : { responses: [] }
    const invalid = rows?.filter((_, index) => !responses.responses[index]?.success).map((row) => row.id) || []
    if (invalid.length) await serviceSupabase.from('member_push_tokens').update({ is_active: false }).in('id', invalid)
    const { error: insertError } = await serviceSupabase.from('notifications').insert({ member_id, gym_id, title, body, type: type || 'general', url: url || '/', is_read: false })
    if (insertError) throw insertError
    return NextResponse.json({ success: true, sent: responses.responses.filter((result) => result.success).length, failed: responses.responses.filter((result) => !result.success).length })
  } catch (error) {
    console.error('[notifications/send]', error)
    return NextResponse.json({ error: 'Unable to send notification' }, { status: 500 })
  }
}
