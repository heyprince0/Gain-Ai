import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const RESERVED_SUBDOMAINS = new Set(['app', 'panel', 'www'])

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // 👑 Panel (gym owner dashboard)
  if (host.startsWith('panel.gainai.space')) {
    // Create Supabase server client to read session cookie
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => request.cookies.get(name)?.value,
        },
      }
    )
    const { data: { session } } = await supabase.auth.getSession()

    // If already signed in and trying to access login → dashboard
    if (pathname === '/gym-owner/login' && session) {
      url.pathname = '/gym-owner/dashboard'
      return NextResponse.redirect(url)
    }

    // If not signed in and trying to access protected routes → login
    if (pathname.startsWith('/gym-owner') && pathname !== '/gym-owner/login' && !session) {
      url.pathname = '/gym-owner/login'
      return NextResponse.redirect(url)
    }

    // For any other panel path, proceed normally
    if (!pathname.startsWith('/gym-owner')) {
      url.pathname = '/gym-owner/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // 📱 Main app (PWA)
  if (host.startsWith('app.gainai.space')) {
    if (pathname.startsWith('/gym-owner')) {
      url.pathname = '/dashboard'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // 🏋️ Gym subdomain redirects
  const subdomainMatch = host.match(/^([^.]+)\.gainai\.space$/)
  if (subdomainMatch && !RESERVED_SUBDOMAINS.has(subdomainMatch[1])) {
    const gymSlug = subdomainMatch[1]
    if (pathname === '/install') {
      url.host = 'app.gainai.space'
      url.pathname = `/g/${encodeURIComponent(gymSlug)}`
      return NextResponse.redirect(url)
    }
    url.host = 'app.gainai.space'
    url.pathname = pathname !== '/' 
      ? `/g/${encodeURIComponent(gymSlug)}${pathname}`
      : `/g/${encodeURIComponent(gymSlug)}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json).*)']
}
