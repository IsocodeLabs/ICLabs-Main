import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_SLUG_ALIASES } from '@/lib/careers/slugs'

/**
 * Host-based rewrite: careers.isocodelabs.com serves the /careers routes from
 * the same app, DB, and admin. On that host:
 *
 *   /                    → /careers
 *   /roles/<slug>        → /careers/roles/<slug>
 *   /applicant-privacy   → /careers/applicant-privacy
 *
 * Alias role slugs (ROLE_SLUG_ALIASES) get a permanent redirect to the real
 * slug, on the careers host and on the in-app /careers/roles path.
 *
 * Everything else on that host (admin, API, legal pages, assets) passes
 * straight through. Coming-soon product subdomains are mapped below; the main
 * domain is untouched.
 */
const CAREERS_PATHS = /^\/(roles\/[a-z0-9-]+|applicant-privacy)\/?$/
const ROLE_PATH = /^(\/careers)?\/roles\/([a-z0-9-]+)\/?$/

/** Subdomains of products that haven't launched yet → their coming-soon page. */
const COMING_SOON_HOSTS = ['lifetreeos', 'meddesk']
/** Paths that keep working on those hosts (legal pages are shared). */
const PASS_THROUGH = ['/privacy', '/terms', '/coming-soon']

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const url = req.nextUrl

  const roleMatch = url.pathname.match(ROLE_PATH)
  const alias = roleMatch && ROLE_SLUG_ALIASES[roleMatch[2]]
  if (alias) {
    // build from the request's own host: behind Cloud Run nextUrl's origin is
    // the container's, not careers.isocodelabs.com
    const proto = req.headers.get('x-forwarded-proto')?.split(',')[0] ?? url.protocol.replace(':', '')
    const to = new URL(`${roleMatch[1] ?? ''}/roles/${alias}${url.search}`, `${proto}://${req.headers.get('host') ?? url.host}`)
    return NextResponse.redirect(to, 308)
  }

  if (host.startsWith('careers.')) {
    if (url.pathname === '/') {
      url.pathname = '/careers'
      return NextResponse.rewrite(url)
    }
    if (CAREERS_PATHS.test(url.pathname)) {
      url.pathname = `/careers${url.pathname.replace(/\/$/, '')}`
      return NextResponse.rewrite(url)
    }
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
