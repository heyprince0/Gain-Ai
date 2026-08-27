// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // ── 1. PANEL SUBDOMAIN (Gym Owners) ──
  // ── 1. PANEL SUBDOMAIN (Gym Owners) ──
if (host.startsWith('panel.gainai.space')) {
  if (!pathname.startsWith('/gym-owner')) {
    url.pathname = '/gym-owner/dashboard'
    return NextResponse.redirect(url)   // was: NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

  // ── 2. APP SUBDOMAIN (Members) ──
  if (host.startsWith('app.gainai.space')) {
    // If user is on app but trying to access owner pages, redirect to member dashboard
    if (pathname.startsWith('/gym-owner')) {
      url.pathname = '/dashboard'
      return NextResponse.rewrite(url)
    }
    // Already on member pages – allow
    return NextResponse.next()
  }

  // ── 3. GYM SUBDOMAINS (e.g., {gymId}.gainai.space) ──
  const subdomainMatch = host.match(/^([^.]+)\.gainai\.space$/)
  if (subdomainMatch) {
    const sub = subdomainMatch[1]
    // Skip reserved subdomains
    if (!['app', 'panel', 'www'].includes(sub)) {
      // These are gym install pages – allow /install path, otherwise redirect to app
      if (pathname === '/install') {
        // Set cookie for the gym
        const response = NextResponse.next()
        response.cookies.set('gainai_pending_gym_id', sub, {
          domain: '.gainai.space',
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
        })
        return response
      }
      // Redirect other paths to app.gainai.space
      url.host = 'app.gainai.space'
      return NextResponse.redirect(url)
    }
  }

  // ── 4. APEX DOMAIN (gainai.space) ──
  // Serve the marketing page
  if (host === 'gainai.space' || host.startsWith('www.')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - logo.png
     * - api (API routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json).*)',
  ],
}
