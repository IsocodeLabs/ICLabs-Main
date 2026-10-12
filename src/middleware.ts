import { NextResponse, type NextRequest } from 'next/server'

/**
 * Host-based rewrite: careers.isocodelabs.com (live) serves the /careers route
 * from the same app, DB, and admin. Only the subdomain root is rewritten —
 * everything else on that host (admin, legal pages, assets) passes straight
 * through, and the main domain is untouched.
 *
 * Careers is a single page, so rewriting the root is enough.
 */
/** Subdomains of products that haven't launched yet → their coming-soon page. */
const COMING_SOON_HOSTS = ['lifetreeos', 'meddesk']
/** Paths that keep working on those hosts (legal pages are shared). */
const PASS_THROUGH = ['/privacy', '/terms', '/coming-soon']

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const url = req.nextUrl

  if (host.startsWith('careers.') && url.pathname === '/') {
    url.pathname = '/careers'
    return NextResponse.rewrite(url)
  }

  // <product>.isocodelabs.com → that product's coming-soon page. Every path
  // lands there (a coming-soon domain has nothing else to show), except the
  // shared legal pages.
  const product = COMING_SOON_HOSTS.find((p) => host.startsWith(`${p}.`))
  if (product && !PASS_THROUGH.some((p) => url.pathname.startsWith(p))) {
    url.pathname = `/coming-soon/${product}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  // skip Next internals, the API, and static files
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
}
