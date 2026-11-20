import { NextResponse, type NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json|sw.js|workbox-*.js).*)'],
}
