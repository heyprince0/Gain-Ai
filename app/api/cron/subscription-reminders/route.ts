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

async function sendNotification({
  member_id,
  gym_id,
  gym_logo,
  title,
  body,
  notification_type,
}: {
  member_id: string
  gym_id: string
  gym_logo: string
  title: string
  body: string
  notification_type: string
}) {
  const db = getServiceSupabase()

  // Get active FCM tokens for this member
  const { data: tokens } = await db
    .from('member_push_tokens')
    .select('id, fcm_token')
    .eq('member_id', member_id)
    .eq('gym_id', gym_id)
    .eq('is_active', true)

  // Send FCM push if tokens exist
  if (tokens?.length) {
    const messaging = getAdminMessaging()
    const responses = await messaging.sendEach(
      tokens.map((t) => ({
        token: t.fcm_token,
        notification: { title, body },
        data: { url: '/membership', gym_logo, type: notification_type },
        webpush: {
          headers: { Urgency: 'high', TTL: '86400' },
          notification: {
            title,
            body,
            icon: gym_logo || '/logo-192.png',
            badge: '/logo-96.png',
            vibrate: [200, 100, 200],
            data: { url: '/membership' },
          },
          fcmOptions: { link: '/membership' },
        },
      }))
    )

    // Deactivate invalid tokens
    const invalid = tokens
      .filter((_, i) => !responses.responses[i]?.success)
      .map((t) => t.id)
    if (invalid.length) {
      await db.from('member_push_tokens').update({ is_active: false }).in('id', invalid)
    }
  }

  // Always insert into notifications table (shows in bell even without FCM token)
  await db.from('notifications').insert({
    member_id,
    gym_id,
    title,
    body,
    notification_type,
    url: '/membership',
    is_read: false,
    sent_at: new Date().toISOString(),
  })
}

export async function GET(request: Request) {
  // ✅ Only Vercel cron can call this — anyone else gets 401
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getServiceSupabase()

  const today = new Date().toISOString().slice(0, 10)
  const twoDaysFromNow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  // Get ALL connected members across ALL gyms whose plan is expiring/expired
  const { data: members, error } = await db
    .from('gym_members')
    .select(`
      id,
      linked_profile_id,
      gym_id,
      end_date,
      gym_subscription_plans ( plan_name ),
      gyms ( logo_url )
    `)
    .eq('app_access', true)
    .is('deleted_at', null)
    .not('linked_profile_id', 'is', null)
    .in('end_date', [yesterday, today, twoDaysFromNow])

  if (error) {
    console.error('[cron] Failed to fetch members:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!members?.length) {
    console.log('[cron] No expiring members today')
    return NextResponse.json({ success: true, sent: 0 })
  }

  // Get notifications already sent in last 24h to avoid duplicates
  const profileIds = members.map((m) => m.linked_profile_id as string)
  const { data: recentNotifs } = await db
    .from('notifications')
    .select('member_id, notification_type')
    .in('member_id', profileIds)
    .in('notification_type', [
      'subscription_expiry_2days',
      'subscription_expiry_today',
      'subscription_expired',
    ])
    .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  // "profileId:type" set for fast lookup
  const alreadyNotified = new Set(
    recentNotifs?.map((n) => `${n.member_id}:${n.notification_type}`) || []
  )

  let sent = 0
  let skipped = 0

  for (const member of members) {
    const profileId = member.linked_profile_id as string
    const endDate = member.end_date
    if (!endDate) continue

    // @ts-ignore
    const planName = member.gym_subscription_plans?.plan_name || 'subscription'
    // @ts-ignore
    const gymLogo = member.gyms?.logo_url || ''

    // Decide which notification type to send
    let notification_type = ''
    let title = ''
    let body = ''

    if (endDate === twoDaysFromNow) {
      notification_type = 'subscription_expiry_2days'
      title = 'Subscription Expiring Soon'
      body = `Your ${planName} plan expires in 2 days. Renew now to keep access.`
    } else if (endDate === today) {
      notification_type = 'subscription_expiry_today'
      title = 'Subscription Expires Today'
      body = `Your ${planName} plan expires today. Renew now to avoid losing access.`
    } else if (endDate === yesterday) {
      notification_type = 'subscription_expired'
      title = 'Subscription Expired'
      body = `Your ${planName} plan has expired. Contact your gym to renew.`
    }

    if (!notification_type) continue

    // Skip if already notified in last 24h
    if (alreadyNotified.has(`${profileId}:${notification_type}`)) {
      skipped++
      continue
    }

    try {
      await sendNotification({
        member_id: profileId,
        gym_id: member.gym_id,
        gym_logo: gymLogo,
        title,
        body,
        notification_type,
      })
      sent++
    } catch (err) {
      console.error(`[cron] Failed for member ${profileId}:`, err)
    }
  }

  console.log(`[cron] Done — sent: ${sent}, skipped (already notified): ${skipped}`)
  return NextResponse.json({ success: true, sent, skipped })
}
