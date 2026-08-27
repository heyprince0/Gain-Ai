import { NextRequest, NextResponse } from 'next/server'

const RESERVED_SUBDOMAINS = new Set(['app', 'panel', 'www'])

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // 👑 Panel (gym owner dashboard)
  if (host.startsWith('panel.gainai.space')) {
    if (!pathname.startsWith('/gym-owner')) {
      url.pathname = '/gym-owner/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // 📱 Main app (this is where the PWA lives)
  if (host.startsWith('app.gainai.space')) {
    // If someone tries to go to gym-owner from app, send them to dashboard
    if (pathname.startsWith('/gym-owner')) {
      url.pathname = '/dashboard'
      return NextResponse.rewrite(url)
    }
    
    // ✅ Allow all other app routes (including /dashboard) to pass through
    // This keeps the PWA running smoothly without redirects
    return NextResponse.next()
  }

  // 🏋️ Gym subdomain redirects (like gymname.gainai.space)
  const subdomainMatch = host.match(/^([^.]+)\.gainai\.space$/)
  if (subdomainMatch && !RESERVED_SUBDOMAINS.has(subdomainMatch[1])) {
    const gymSlug = subdomainMatch[1]
    
    // If user visits the install page directly, keep them on the install page
    if (pathname === '/install') {
      url.host = 'app.gainai.space'
      url.pathname = `/g/${encodeURIComponent(gymSlug)}`
      return NextResponse.redirect(url)
    }
    
    // All other routes on gym subdomain → redirect to app.gainai.space/gym-slug
    url.host = 'app.gainai.space'
    // Preserve the path if it's not the root
    if (pathname !== '/') {
      url.pathname = `/g/${encodeURIComponent(gymSlug)}${pathname}`
    } else {
      url.pathname = `/g/${encodeURIComponent(gymSlug)}`
    }
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = { 
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json).*)'] 
}
