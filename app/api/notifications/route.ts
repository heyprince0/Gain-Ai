import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ Service role client — bypasses RLS, we filter by user.id manually
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify the token to get the user
    // ✅ Use anon key just for token verification (no DB query here)
    const verifyClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ✅ Use service role for the actual DB query
    // supabaseBrowser in a server route has no user JWT → RLS blocks it
    const { data, error } = await getServiceSupabase()
      .from('notifications')
      .select('*')
      .eq('member_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return NextResponse.json({ notifications: data || [], limit: 20 })
  } catch (error) {
    console.error('[notifications/list]', error)
    return NextResponse.json({ error: 'Unable to load notifications' }, { status: 500 })
  }
}
