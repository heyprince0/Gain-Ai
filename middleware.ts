import { NextRequest, NextResponse } from 'next/server'

const RESERVED_SUBDOMAINS = new Set(['app', 'panel', 'www'])

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  if (host.startsWith('panel.gainai.space')) {
    if (!pathname.startsWith('/gym-owner')) {
      url.pathname = '/gym-owner/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (host.startsWith('app.gainai.space')) {
    if (pathname.startsWith('/gym-owner')) {
      url.pathname = '/dashboard'
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  const subdomainMatch = host.match(/^([^.]+)\.gainai\.space$/)
  if (subdomainMatch && !RESERVED_SUBDOMAINS.has(subdomainMatch[1])) {
    if (pathname === '/install') {
      url.host = 'app.gainai.space'
      url.pathname = `/g/${encodeURIComponent(subdomainMatch[1])}`
      return NextResponse.redirect(url)
    }
    url.host = 'app.gainai.space'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json).*)'] }
