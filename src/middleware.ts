import { NextResponse, type NextRequest } from 'next/server'

/**
 * Host-based rewrite: careers.isocodelabs.com serves the /careers route from the
 * same app, DB, and admin. Only the subdomain root is rewritten — everything
 * else on that host (admin, legal pages, assets) passes straight through, and
 * the main domain is untouched.
 *
 * Careers is a single page, so rewriting the root is enough. When the subdomain
 * is live, point DNS at the same deployment and this takes over transparently;
 * until then, /careers works directly.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const url = req.nextUrl

  if (host.startsWith('careers.') && url.pathname === '/') {
    url.pathname = '/careers'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  // skip Next internals, the API, and static files
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
}
