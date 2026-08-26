// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // ── Extract gymId from subdomain ──
  const subdomainMatch = host.match(/^([^.]+)\.gainai\.space$/)
  let gymId: string | null = null
  if (subdomainMatch) {
    const sub = subdomainMatch[1]
    if (!['app', 'panel', 'www'].includes(sub)) {
      gymId = sub
    }
  }

  // ── If visiting /install with a gym subdomain, set the cookie ──
  if (gymId && pathname === '/install') {
    const response = NextResponse.next()
    response.cookies.set('gainai_pending_gym_id', gymId, {
      domain: '.gainai.space',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return response
  }

  // ── Panel subdomain (gym owners) ──
  if (host.startsWith('panel.gainai.space')) {
    if (!pathname.startsWith('/gym-owner')) {
      url.pathname = '/gym-owner/dashboard'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // ── App subdomain (members) ──
  if (host.startsWith('app.gainai.space')) {
    if (pathname.startsWith('/gym-owner')) {
      url.pathname = '/dashboard'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // ── Apex domain ── serve marketing page
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json).*)'],
}
