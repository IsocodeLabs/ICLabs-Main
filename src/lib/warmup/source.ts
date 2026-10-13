/**
 * Where did this visitor come from? — a client-side, on-device guess used only
 * to decide what to warm up in the background (see ./plan.ts).
 *
 * Nothing here is sent anywhere and nothing is written to a cookie: the
 * answer is read from the URL / referrer / in-app browser and held in
 * sessionStorage so it survives navigating around the site and is dropped when
 * the tab closes. (The site's privacy notice says so.)
 *
 * Signals, strongest first:
 *   1. an explicit tag on the link  — ?utm_source=linkedin (also ?src= / ?ref=)
 *   2. the referrer's host          — linkedin.com, lnkd.in, wa.me, google…
 *   3. the in-app browser's UA      — the LinkedIn app often strips the referrer
 * A later, weaker reading never overwrites the first real one in a session.
 */

export type TrafficSource = 'linkedin' | 'whatsapp' | 'search' | 'direct' | 'other'

const STORE_KEY = 'il.src'
const OUR_SITE = /(^|\.)isocodelabs\.com$/i

/** [source, matches the utm tag, matches the referrer host] */
const RULES: Array<[Exclude<TrafficSource, 'direct' | 'other'>, RegExp, RegExp]> = [
  ['linkedin', /linkedin|lnkd/i, /(^|\.)(linkedin\.com|lnkd\.in)$/i],
  ['whatsapp', /whatsapp|^wa$/i, /(^|\.)(whatsapp\.com|wa\.me)$/i],
  [
    'search',
    /^(google|bing|duckduckgo|yahoo|ecosia)$/i,
    /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.com|ecosia\.org)$/i,
  ],
]

let memo: TrafficSource | null = null

function fromTag(search: string): TrafficSource | null {
  const q = new URLSearchParams(search)
  const tag = (q.get('utm_source') || q.get('src') || q.get('ref') || '').trim()
  if (!tag) return null
  for (const [source, tagRe] of RULES) if (tagRe.test(tag)) return source
  return 'other'
}

/** 'internal' = our own site (not informative), null = no referrer at all */
function fromReferrer(referrer: string): TrafficSource | 'internal' | null {
  if (!referrer) return null
  let host: string
  try {
    host = new URL(referrer).hostname
  } catch {
    return null
  }
  if (OUR_SITE.test(host) || host === location.hostname) return 'internal'
  for (const [source, , hostRe] of RULES) if (hostRe.test(host)) return source
  return 'other'
}

function read(): TrafficSource | null {
  try {
    return (sessionStorage.getItem(STORE_KEY) as TrafficSource | null) || null
  } catch {
    return null
  }
}

function write(s: TrafficSource) {
  try {
    sessionStorage.setItem(STORE_KEY, s)
  } catch {
    // storage blocked — the guess just isn't remembered across pages
  }
}

/** The visitor's traffic source, decided once per page load and remembered per tab. */
export function detectSource(): TrafficSource {
  if (memo) return memo

  const tagged = fromTag(location.search)
  const ref = fromReferrer(document.referrer)
  const inApp = /LinkedInApp/i.test(navigator.userAgent) ? 'linkedin' : null

  // a real, outside signal from this page load (an internal referrer says nothing)
  const fresh: TrafficSource | null =
    tagged ?? (ref && ref !== 'internal' ? ref : null) ?? inApp

  // the first meaningful source in a session wins; later pages in the same tab
  // arrive with an internal referrer and just inherit it
  const stored = read()
  const meaningful = (s: TrafficSource | null) => s !== null && s !== 'direct' && s !== 'other'
  memo = meaningful(stored) ? stored! : (fresh ?? stored ?? 'direct')
  write(memo)
  return memo
}

/** LinkedIn / WhatsApp referrals are overwhelmingly people looking at the roles. */
export const isJobSeekerSource = (s: TrafficSource) => s === 'linkedin' || s === 'whatsapp'
