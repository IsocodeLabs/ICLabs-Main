import { buildWhere, csvCell, filtersFrom, requireAdmin, sortFor } from '@/lib/careers/admin'
import { logError } from '@/lib/careers/log'
import { loadReviews } from '@/lib/careers/reviews'
import { DECISIONS, reviewLabel } from '@/lib/careers/review'

export const dynamic = 'force-dynamic'

const COLUMNS = [
  ['Name', 'name'],
  ['Email', 'email'],
  ['Phone', 'phone'],
  ['Role', 'roleTitle'],
  ['College', 'college'],
  ['Graduation year', 'gradYear'],
  ['LinkedIn', 'linkedinUrl'],
  ['GitHub', 'githubUrl'],
  ['Portfolio', 'portfolioUrl'],
  ['Project', 'projectUrl'],
  ['Rating', 'rating'],
  ['Stage', 'stage'],
  ['Tags', 'tags'],
  ['Applied at', 'createdAt'],
] as const

/** Each founder's decision and rating, e.g. "Dex: approve · 4/5; Aryan: maybe". Notes are left out on purpose. */
const reviewsCell = (reviews: { reviewer: string; decision: string; rating: number | null }[]) =>
  reviews
    .map((r) => {
      const label = DECISIONS.find((d) => d.value === r.decision)?.label ?? r.decision
      return `${r.reviewer}: ${label.toLowerCase()}${r.rating ? ` · ${r.rating}/5` : ''}`
    })
    .join('; ')

/**
 * CSV of everything matching the current filter (for mailing shortlisted
 * candidates). Streams page by page so 10k rows never sit in memory at once.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload, user } = auth
  const filters = filtersFrom(new URL(req.url).searchParams)
  const where = buildWhere(filters)
  const encoder = new TextEncoder()
  let count = 0

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode('﻿' + [...COLUMNS.map(([h]) => h), 'Review result', 'Reviews (decision · rating)'].join(',') + '\n'))
        for (let page = 1; ; page++) {
          const res = await payload.find({
            collection: 'applications',
            where,
            sort: sortFor(filters),
            page,
            limit: 500,
            depth: 0,
            overrideAccess: true,
            select: Object.fromEntries([...COLUMNS.map(([, k]) => [k, true]), ['reviewState', true], ['reviewDecision', true]]),
          })
          const reviews = await loadReviews(payload, res.docs.map((d) => d.id))
          const lines = res.docs.map((d) => {
            const base = COLUMNS.map(([, k]) => {
              const v = (d as unknown as Record<string, unknown>)[k]
              return csvCell(Array.isArray(v) ? v.join('; ') : v)
            })
            // the review columns are derived, not stored as-is
            const mine = reviews.get(d.id) ?? []
            const review = [
              csvCell(reviewLabel(d.reviewState, d.reviewDecision)),
              csvCell(reviewsCell(mine)),
            ]
            return [...base, ...review].join(',')
          })
          count += lines.length
          if (lines.length) controller.enqueue(encoder.encode(lines.join('\n') + '\n'))
          if (!res.hasNextPage) break
        }
        await payload.create({
          collection: 'careers-audit-log',
          overrideAccess: true,
          data: { action: 'csv_export', actor: user.id, detail: { count, filters } },
        })
        controller.close()
      } catch (err) {
        logError('admin_csv_failed', err)
        controller.error(err)
      }
    },
  })

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  return new Response(stream, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="isocode-applicants-${stamp}.csv"`,
      'cache-control': 'private, no-store',
    },
  })
}
