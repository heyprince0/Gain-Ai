// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

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

  // ── apex domain (gainai.space) and www ──
  // Do NOT redirect www here – let Vercel handle it
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json).*)',
  ],
}
