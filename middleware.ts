// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // ── Panel subdomain (owners) ──
  if (host.startsWith('panel.gainai.space')) {
    // REWRITE to /gym-owner/dashboard – URL stays panel.gainai.space
    if (!url.pathname.startsWith('/gym-owner')) {
      url.pathname = '/gym-owner/dashboard'
      return NextResponse.rewrite(url)   // ← REWRITE, not redirect
    }
    return NextResponse.next()
  }

  // ── App subdomain (members) ──
  if (host.startsWith('app.gainai.space')) {
    if (url.pathname.startsWith('/gym-owner')) {
      url.pathname = '/dashboard'
      return NextResponse.rewrite(url)   // ← REWRITE
    }
    return NextResponse.next()
  }

  // ── www → apex (optional, Vercel can handle this too) ──
  if (host.startsWith('www.gainai.space')) {
    url.host = 'gainai.space'
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json).*)',
  ],
}
