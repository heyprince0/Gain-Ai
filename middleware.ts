// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // ── Panel subdomain (gym owners) ──
  if (host.startsWith('panel.gainai.space')) {
    // If user is on panel but not on a gym-owner path, redirect to owner dashboard
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
  // This now serves the main application without redirecting to app.gainai.space.
  // You can add specific logic here if needed, like redirecting www to apex.
  if (host.startsWith('www.gainai.space')) {
    // Redirect www to apex (optional, but good for SEO)
    url.host = 'gainai.space'
    return NextResponse.redirect(url)
  }

  // Allow all other requests (including gainai.space) to proceed normally
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
