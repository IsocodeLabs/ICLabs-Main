import { APPLICATION_STAGES } from '@/collections/Applications'
import { buildWhere, filtersFrom, requireAdmin, ROW_SELECT, sortFor, toRow } from '@/lib/careers/admin'
import { hashId } from '@/lib/careers/crypto'
import { logError } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

/** List applications — server-side filtered + paginated (50 a page, never all). */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload } = auth
  const params = new URL(req.url).searchParams
  const filters = filtersFrom(params)
  const page = Math.max(1, Number(params.get('page')) || 1)
  try {
    const res = await payload.find({
      collection: 'applications',
      where: buildWhere(filters),
      sort: sortFor(filters),
      page,
      limit: PAGE_SIZE,
      depth: 1,
      select: ROW_SELECT,
      overrideAccess: true,
      populate: { users: { name: true, email: true } },
    })
    return json({
      ok: true,
      docs: res.docs.map((d) => toRow(d as never)),
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
  const ids = (body.ids ?? []).filter((n) => Number.isInteger(n)).slice(0, 5000)
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
