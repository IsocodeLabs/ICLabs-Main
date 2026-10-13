/**
 * The warm-up plan: what to quietly load in the background once the page the
 * visitor asked for is up, in priority order, given where they came from.
 *
 * This is the one place that encodes the traffic prediction. To change what
 * gets warmed, edit the tables in `planFor` — nothing else needs to know.
 * Steps run strictly in the order listed, one at a time, only while the browser
 * is idle (see components/site/Warmup.tsx).
 *
 * The reference journey (LinkedIn): home → careers → a role's JD → apply.
 *   home      warms  careers (page + the JS/CSS/fonts it shares), then each JD,
 *             then the apply-side connections (Turnstile, the CV bucket)
 *   careers   warms  each JD, then the apply-side connections
 *   a JD      warms  the apply-side connections, then the other JDs
 * Visitors from anywhere else are mostly prospective clients, so they get the
 * quiz and /about instead.
 */
import { isJobSeekerSource, type TrafficSource } from './source'

export type PageKind = 'home' | 'about' | 'quiz' | 'careers' | 'role' | 'other'

export type Step =
  /** open the connection early (DNS + TLS) so the real request is instant */
  | { kind: 'connect'; origin: string }
  /** a same-origin Next route: prefetch its RSC payload + chunks */
  | { kind: 'route'; href: string }
  /** a full document (another host, or a hard navigation): fetch it into the
   *  HTTP cache. `mirror` also fetches this page's own JS/CSS/fonts under the
   *  target's origin — a subdomain is a separate cache key, so otherwise the
   *  whole framework is downloaded a second time on arrival. */
  | { kind: 'document'; href: string; mirror?: boolean }
  | { kind: 'image'; href: string }

export type PlanInput = {
  source: TrafficSource
  page: PageKind
  /** where the careers site lives: '' (same origin, /careers/...) or https://careers.… */
  careersOrigin: string
  /** open named roles' slugs, in display order */
  roleSlugs: string[]
  /** the visitor is already on the careers host (paths have no /careers prefix) */
  onCareersHost: boolean
  /** the role page being viewed, if any (it isn't warmed again) */
  currentRole?: string
}

/** Third parties the apply form talks to: bot check + the CV upload bucket. */
const APPLY_ORIGINS = ['https://challenges.cloudflare.com', 'https://storage.googleapis.com']

export function planFor(input: PlanInput): Step[] {
  const { source, page, careersOrigin, roleSlugs, onCareersHost, currentRole } = input

  // careers URLs exactly as the visitor's browser will request them: on its own
  // host the paths have no /careers prefix; without that host they do
  const prefix = onCareersHost || careersOrigin ? '' : '/careers'
  const careersUrl = (path: string) => `${careersOrigin}${prefix}${path}`
  const careersHome = careersUrl('') || '/'
  const roleDocs = (except?: string): Step[] =>
    roleSlugs
      .filter((s) => s !== except)
      .map((s) => ({ kind: 'document', href: careersUrl(`/roles/${s}`) }))
  const applyConnections: Step[] = APPLY_ORIGINS.map((origin) => ({ kind: 'connect', origin }))

  switch (page) {
    case 'home':
    case 'about': {
      if (isJobSeekerSource(source)) {
        return [
          ...(careersOrigin ? [{ kind: 'connect', origin: careersOrigin } as Step] : []),
          { kind: 'document', href: careersHome, mirror: Boolean(careersOrigin) },
          { kind: 'image', href: `${careersOrigin}/assets/careers/careers-base.jpg` },
          ...roleDocs(),
          ...applyConnections,
          ...(page === 'home' ? [{ kind: 'route', href: '/about' } as Step] : []),
          { kind: 'route', href: '/quiz' },
        ]
      }
      return [
        { kind: 'route', href: '/quiz' },
        ...(page === 'home' ? [{ kind: 'route', href: '/about' } as Step] : []),
        ...(careersOrigin ? [{ kind: 'connect', origin: careersOrigin } as Step] : []),
      ]
    }

    case 'careers':
      return [...applyConnections, ...roleDocs()]

    case 'role':
      return [...applyConnections, ...roleDocs(currentRole)]

    // the quiz is the conversion page — leave the bandwidth to it
    case 'quiz':
    case 'other':
    default:
      return []
  }
}

/** The role slug in a careers URL (/roles/<slug> or /careers/roles/<slug>). */
export const roleSlugOf = (pathname: string): string | undefined =>
  pathname.match(/\/roles\/([a-z0-9-]+)/)?.[1]

/** Classify the current URL. Careers is its own host in production. */
export function pageKindOf(pathname: string, onCareersHost: boolean): PageKind {
  const p = pathname.replace(/\/$/, '') || '/'
  if (onCareersHost || p.startsWith('/careers')) {
    if (/\/roles\/[a-z0-9-]+$/.test(p)) return 'role'
    if (p === '/' || p === '/careers') return 'careers'
    return 'other'
  }
  if (p === '/') return 'home'
  if (p === '/about') return 'about'
  if (p.startsWith('/quiz')) return 'quiz'
  return 'other'
}
