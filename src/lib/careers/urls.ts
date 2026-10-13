/**
 * Careers links. In production the careers site lives on its own host
 * (NEXT_PUBLIC_CAREERS_URL=https://careers.isocodelabs.com), where middleware
 * maps `/` → /careers and `/roles/x` → /careers/roles/x. Without the env var
 * (local dev, previews) links fall back to the in-app /careers paths.
 */
export const CAREERS_URL = (process.env.NEXT_PUBLIC_CAREERS_URL || '').replace(/\/$/, '')

export function careersHref(path = '/'): string {
  const p = path.startsWith('/') ? path : `/${path}`
  if (CAREERS_URL) return `${CAREERS_URL}${p === '/' ? '' : p}` || '/'
  if (p === '/') return '/careers'
  if (p.startsWith('/#')) return `/careers${p.slice(1)}`
  return `/careers${p}`
}

/** True for a link that leaves for the careers site (it opens in a new tab). */
export const isCareersUrl = (href: string) => /^https?:\/\/careers\./i.test(href)

/** Canonical absolute URL (SEO, JSON-LD, sitemap) — always the live subdomain. */
export const CAREERS_CANONICAL = CAREERS_URL || 'https://careers.isocodelabs.com'
export const canonicalCareersUrl = (path = '/') =>
  `${CAREERS_CANONICAL}${path === '/' ? '' : path}`
