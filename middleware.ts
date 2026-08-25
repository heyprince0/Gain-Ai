// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // ── Prevent redirect loops ──
  // If we're already on gainai.space (not www), don't redirect again
  if (host === 'gainai.space') {
    // Allow the request to proceed without redirects
    return NextResponse.next()
  }

  // ── Remove www from URL ──
  if (host.startsWith('www.gainai.space')) {
    url.host = 'gainai.space'
    return NextResponse.redirect(url, { status: 301 })
  }

  // ── Panel subdomain (gym owners) ──
  if (host.startsWith('panel.gainai.space')) {
    if (!url.pathname.startsWith('/gym-owner')) {
      url.pathname = '/gym-owner/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── App subdomain (members) ──
  if (host.startsWith('app.gainai.space')) {
    if (url.pathname.startsWith('/gym-owner')) {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── Apex domain (gainai.space) ──
  // Serve the app normally without redirecting
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json).*)',
  ],
}
