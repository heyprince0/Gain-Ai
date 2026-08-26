// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // ── Panel subdomain (gym owners) ──
  if (host.startsWith('panel.gainai.space')) {
    if (!url.pathname.startsWith('/gym-owner')) {
      url.pathname = '/gym-owner/dashboard'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // ── App subdomain (members) ──
  if (host.startsWith('app.gainai.space')) {
    if (url.pathname.startsWith('/gym-owner')) {
      url.pathname = '/dashboard'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  // ── Unknown subdomains (e.g., {gymId}.gainai.space) ──
  // Check if it's a subdomain of gainai.space
  const match = host.match(/^([^.]+)\.gainai\.space$/)
  if (match) {
    const subdomain = match[1]
    // Skip reserved subdomains
    if (!['app', 'panel', 'www'].includes(subdomain)) {
      // Allow the request to proceed normally
      // The install page will read the subdomain as gymId
      return NextResponse.next()
    }
  }

  // ── Apex domain (gainai.space) ──
  // Serve the marketing page normally
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json).*)',
  ],
}
