// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // ── Panel subdomain (gym owners) ──
  if (host.startsWith('panel.gainai.space')) {
    // If user is on panel but trying to access a member page, redirect to owner dashboard
    if (!url.pathname.startsWith('/gym-owner')) {
      url.pathname = '/gym-owner/dashboard'
      return NextResponse.redirect(url)
    }
    // Otherwise, allow the request (already on /gym-owner/*)
    return NextResponse.next()
  }

  // ── App subdomain (members) ──
  if (host.startsWith('app.gainai.space')) {
    // If user is on app but trying to access owner pages, redirect to member dashboard
    if (url.pathname.startsWith('/gym-owner')) {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    // Otherwise, allow the request
    return NextResponse.next()
  }

  // ── Apex domain (gainai.space) or www ──
  // Redirect to app.gainai.space (member app) by default
  if (!host.startsWith('app.') && !host.startsWith('panel.')) {
    url.host = 'app.gainai.space'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - logo.png (app logo)
     * - api (API routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
}
