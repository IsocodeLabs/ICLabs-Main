import { APPLICATION_STAGES } from '@/collections/Applications'
import { buildWhere, filtersFrom, requireAdmin, ROW_SELECT, sortFor, toRow } from '@/lib/careers/admin'
import { hashId } from '@/lib/careers/crypto'
import { logError } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'
import { loadReviews } from '@/lib/careers/reviews'
import type { Where } from 'payload'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 1000
/** Most rows "Select all matching" (and a bulk stage change by id) will take. */
const MAX_SELECT = 10000

/**
 * List applications — server-side filtered + paginated (1000 a page).
 * `?idsOnly=1` instead returns just the ids of everything matching the filter
 * (up to MAX_SELECT), for "Select all matching this filter".
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload, user } = auth
  const params = new URL(req.url).searchParams
  const filters = filtersFrom(params)
  const page = Math.max(1, Number(params.get('page')) || 1)
  try {
    // "needs my review": everything I haven't reviewed yet
    let notMine: Where | undefined
    if (filters.review === 'mine') {
      const mine = await payload.find({
        collection: 'application-reviews',
        where: { reviewer: { equals: user.id } },
        pagination: false,
        depth: 0,
        overrideAccess: true,
        select: { application: true },
      })
      const ids = mine.docs.map((d) => (typeof d.application === 'object' ? d.application.id : d.application))
      if (ids.length) notMine = { id: { not_in: ids } }
    }
    if (params.get('idsOnly')) {
      const all = await payload.find({
        collection: 'applications',
        where: buildWhere(filters, notMine),
        sort: sortFor(filters),
        limit: MAX_SELECT,
        depth: 0,
        select: { stage: true },
        overrideAccess: true,
      })
      return json({ ok: true, ids: all.docs.map((d) => d.id), totalDocs: all.totalDocs })
    }
    const res = await payload.find({
      collection: 'applications',
      where: buildWhere(filters, notMine),
      sort: sortFor(filters),
      page,
      limit: PAGE_SIZE,
      depth: 1,
      select: ROW_SELECT,
      overrideAccess: true,
      populate: { users: { name: true, email: true } },
    })
    const reviews = await loadReviews(payload, res.docs.map((d) => d.id))
    return json({
      ok: true,
      viewer: { id: user.id, name: user.name || user.email },
      docs: res.docs.map((d) => toRow(d as never, reviews.get(d.id) ?? [])),
      totalDocs: res.totalDocs,
      page: res.page,
      totalPages: res.totalPages,
    })
  } catch (err) {
    logError('admin_list_failed', err)
    return json({ ok: false, error: 'Couldn’t load applications.' }, 500)
  }
}

/**
 * Bulk stage change — on the selected ids, or on everything matching the
 * current filter (`all: true`). Each row goes through the collection hook, so
 * who/when is recorded per applicant; the bulk action itself is audit-logged.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload, user } = auth
  const body = (await req.json().catch(() => ({}))) as {
    ids?: number[]
    all?: boolean
    filters?: Record<string, string>
    stage?: string
  }
  if (!APPLICATION_STAGES.some((s) => s.value === body.stage)) {
    return json({ ok: false, error: 'Unknown stage' }, 400)
  }
  const ids = (body.ids ?? []).filter((n) => Number.isInteger(n)).slice(0, MAX_SELECT)
  const where = body.all ? buildWhere(filtersFrom(body.filters ?? {})) : { id: { in: ids } }
  if (!body.all && ids.length === 0) return json({ ok: false, error: 'Nothing selected' }, 400)

  try {
    const res = await payload.update({
      collection: 'applications',
      where,
      data: { stage: body.stage as never },
      user,
      overrideAccess: true,
      depth: 0,
      select: { stage: true },
    })
    await payload.create({
      collection: 'careers-audit-log',
      overrideAccess: true,
      data: {
        action: 'bulk_stage',
        actor: user.id,
        detail: {
          stage: body.stage,
          count: res.docs.length,
          scope: body.all ? 'filter' : 'selection',
          filters: body.all ? body.filters ?? {} : undefined,
          ids: body.all ? undefined : ids.slice(0, 500),
        },
      },
    })
    return json({ ok: true, updated: res.docs.length, failed: res.errors.length })
  } catch (err) {
    logError('admin_bulk_failed', err, { actor: hashId(String(user.id)) })
    return json({ ok: false, error: 'Bulk update failed.' }, 500)
  }
}
