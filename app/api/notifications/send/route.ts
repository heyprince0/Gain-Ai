import { NextResponse } from 'next/server'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { createClient } from '@supabase/supabase-js'

function getAdminMessaging() {
  const adminApp =
    getApps()[0] ||
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON!)) })
  return getMessaging(adminApp)
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  try {
    const { member_id, gym_id, title, body, type, url } = await request.json()

    if (!member_id || !gym_id || !title || !body)
      return NextResponse.json(
        { error: 'member_id, gym_id, title, and body are required' },
        { status: 400 }
      )

    const adminMessaging = getAdminMessaging()
    const serviceSupabase = getServiceSupabase()

    // Fetch gym logo and name
    const { data: gym } = await serviceSupabase
      .from('gyms')
      .select('gym_name, logo_url')
      .eq('id', gym_id)
      .maybeSingle()

    const gymLogo = gym?.logo_url || ''
    const notifUrl = url || '/membership'

    // Fetch active push tokens
    const { data: rows, error: tokenError } = await serviceSupabase
      .from('member_push_tokens')
      .select('id, fcm_token')
      .eq('member_id', member_id)
      .eq('gym_id', gym_id)
      .eq('is_active', true)

    if (tokenError) throw tokenError

    const responses = rows?.length
      ? await adminMessaging.sendEach(
          rows.map((row) => ({
            token: row.fcm_token,

            // ✅ notification field → OS shows it even when browser is killed
            // This is the most reliable method for Android background delivery
            notification: {
              title,
              body,
            },

            // ✅ data field → available in notificationclick handler
            data: {
              url: notifUrl,
              type: type || 'general',
              gym_logo: gymLogo,
            },

            webpush: {
              headers: {
                Urgency: 'high', // force delivery through battery saver
                TTL: '86400',
              },
              // ✅ webpush.notification overrides the display
              // This is what sets the ICON, BADGE, VIBRATION on Android
              // The OS reads this directly — no SW needed to be running
              notification: {
                title,
                body,
                icon: gymLogo || '/logo-192.png', // ← gym logo shows here
                badge: '/logo-96.png',
                vibrate: [200, 100, 200],
                requireInteraction: false,
                data: { url: notifUrl },
              },
              fcmOptions: {
                link: notifUrl, // ← tapping notification opens this
              },
            },
          }))
        )
      : { responses: [] }

    // Deactivate invalid/expired tokens
    const invalid =
      rows
        ?.filter((_, i) => !responses.responses[i]?.success)
        .map((r) => r.id) || []

    if (invalid.length) {
      await serviceSupabase
        .from('member_push_tokens')
        .update({ is_active: false })
        .in('id', invalid)
    }

    // Save to notifications table
    const { error: insertError } = await serviceSupabase
      .from('notifications')
      .insert({
        member_id,
        gym_id,
        title,
        body,
        notification_type: type || 'general',
        url: notifUrl,
        is_read: false,
        sent_at: new Date().toISOString(),
      })

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      sent: responses.responses.filter((r) => r.success).length,
      failed: responses.responses.filter((r) => !r.success).length,
    })
  } catch (error) {
    console.error('[notifications/send]', error)
    return NextResponse.json({ error: 'Unable to send notification' }, { status: 500 })
  }
}
