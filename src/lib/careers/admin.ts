import type { Payload, Where } from 'payload'
import type { Application, User } from '@/payload-types'
import { careersConfig } from './config'
import { payloadInstance } from './db'
import { json } from './request'

/**
 * Shared plumbing for the founders' screening API (/api/careers/admin/*):
 * auth (a logged-in Payload user — founders only), the filter → `where`
 * builder used by the list, bulk actions and both exports, and row shaping.
 */
export async function requireAdmin(
  req: Request,
): Promise<{ payload: Payload; user: User } | { error: Response }> {
  // custom header on writes: a cross-site form/fetch can't set it without a CORS
  // preflight we never grant, so cookie-authenticated writes can't be forged
  if (req.method !== 'GET' && req.headers.get('x-careers-admin') !== '1') {
    return { error: json({ ok: false, error: 'Bad request' }, 400) }
  }
  const payload = await payloadInstance()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || user.collection !== 'users') return { error: json({ ok: false, error: 'Not signed in' }, 401) }
  return { payload, user: user as User }
}

export type Filters = {
  role?: string
  stage?: string
  cycle?: string
  gradYear?: string
  college?: string
  ratingMin?: string
  unrated?: string
  tag?: string
  from?: string
  to?: string
  q?: string
  sort?: string
}

export const FILTER_KEYS: (keyof Filters)[] = [
  'role',
  'stage',
  'cycle',
  'gradYear',
  'college',
  'ratingMin',
  'unrated',
  'tag',
  'from',
  'to',
  'q',
  'sort',
]

export function filtersFrom(params: URLSearchParams | Record<string, unknown>): Filters {
  const get = (k: string) =>
    params instanceof URLSearchParams ? params.get(k) : (params[k] as string | undefined | null)
  const f: Filters = {}
  for (const k of FILTER_KEYS) {
    const v = get(k)
    if (typeof v === 'string' && v.trim()) f[k] = v.trim().slice(0, 200)
  }
  return f
}

export function buildWhere(f: Filters): Where {
  const and: Where[] = []
  const cycle = f.cycle ?? careersConfig.cycle
  if (cycle !== 'all') and.push({ cycle: { equals: cycle } })
  if (f.role) and.push({ role: { equals: f.role } })
  if (f.stage) and.push({ stage: { equals: f.stage } })
  if (f.gradYear && /^\d{4}$/.test(f.gradYear)) and.push({ gradYear: { equals: Number(f.gradYear) } })
  if (f.college) and.push({ college: { like: f.college } })
  if (f.unrated === '1') and.push({ rating: { exists: false } })
  else if (f.ratingMin && /^[1-5]$/.test(f.ratingMin)) {
    and.push({ rating: { greater_than_equal: Number(f.ratingMin) } })
  }
  if (f.sort === 'rating') and.push({ rating: { exists: true } })
  if (f.tag) and.push({ tags: { in: [f.tag] } })
  if (f.from && /^\d{4}-\d{2}-\d{2}$/.test(f.from)) {
    and.push({ createdAt: { greater_than_equal: `${f.from}T00:00:00.000+05:30` } })
  }
  if (f.to && /^\d{4}-\d{2}-\d{2}$/.test(f.to)) {
    and.push({ createdAt: { less_than_equal: `${f.to}T23:59:59.999+05:30` } })
  }
  if (f.q) {
    and.push({
      or: [{ name: { like: f.q } }, { email: { like: f.q } }, { college: { like: f.q } }],
    })
  }
  return and.length ? { and } : {}
}

export function sortFor(f: Filters): string | string[] {
  if (f.sort === 'oldest') return 'createdAt'
  if (f.sort === 'rating') return ['-rating', '-createdAt']
  return '-createdAt'
}

export const ROW_SELECT = {
  name: true,
  email: true,
  phone: true,
  role: true,
  roleTitle: true,
  cycle: true,
  stage: true,
  rating: true,
  tags: true,
  college: true,
  gradYear: true,
  startDate: true,
  commitSixMonths: true,
  linkedinUrl: true,
  githubUrl: true,
  portfolioUrl: true,
  projectUrl: true,
  pitchNote: true,
  why: true,
  interestArea: true,
  notes: true,
  objectKey: true,
  resume: true,
  stageChangedAt: true,
  stageHistory: true,
  createdAt: true,
  // legacy fields so pre-v2 rows still show something useful
  year: true,
  status: true,
} as const

export type Row = ReturnType<typeof toRow>

export function toRow(a: Partial<Application> & { id: number }) {
  return {
    id: a.id,
    name: a.name ?? '',
    email: a.email ?? '',
    phone: a.phone ?? '',
    role: a.role ?? '',
    roleTitle: a.roleTitle ?? '',
    cycle: a.cycle ?? '',
    stage: (a.stage ?? 'applied') as string,
    rating: a.rating ?? null,
    tags: a.tags ?? [],
    college: a.college ?? '',
    gradYear: a.gradYear ?? (a.year ? Number(a.year) || null : null),
    startDate: a.startDate ?? null,
    commitSixMonths: Boolean(a.commitSixMonths),
    linkedinUrl: a.linkedinUrl ?? '',
    githubUrl: a.githubUrl ?? '',
    portfolioUrl: a.portfolioUrl ?? '',
    projectUrl: a.projectUrl ?? '',
    pitchNote: a.pitchNote ?? '',
    why: a.why ?? '',
    interestArea: a.interestArea ?? '',
    notes: a.notes ?? '',
    hasCv: Boolean(a.objectKey || a.resume),
    stageChangedAt: a.stageChangedAt ?? null,
    stageHistory: (a.stageHistory ?? []).map((h) => ({
      stage: h.stage ?? '',
      at: h.at ?? '',
      by: typeof h.by === 'object' && h.by ? (h.by.name || h.by.email) : null,
    })),
    createdAt: a.createdAt ?? '',
  }
}

/** Neutralise spreadsheet formula injection in CSV cells. */
export function csvCell(v: unknown): string {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function safeFilePart(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'applicant'
}
