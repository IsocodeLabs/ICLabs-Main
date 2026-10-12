import { requireAdmin } from '@/lib/careers/admin'
import { logError } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'
import { invalidateRoleCache } from '@/lib/careers/roles'

export const dynamic = 'force-dynamic'

/**
 * Role controls from the screening view: status (open / paused / closed) and
 * the application cap. Goes through the collection's afterChange hook, which
 * revalidates the careers pages.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload, user } = auth
  const id = Number((await params).id)
  const body = (await req.json().catch(() => ({}))) as { status?: string; applicationCap?: number | null }
  const data: Record<string, unknown> = {}
  if (body.status !== undefined) {
    if (!['open', 'paused', 'closed'].includes(body.status)) {
      return json({ ok: false, error: 'Status must be open, paused or closed' }, 400)
    }
    data.status = body.status
  }
  if ('applicationCap' in body) {
    const cap = body.applicationCap
    if (cap === null) data.applicationCap = null
    else if (Number.isInteger(cap) && cap! > 0 && cap! < 1_000_000) data.applicationCap = cap
    else return json({ ok: false, error: 'Cap must be a positive whole number' }, 400)
  }
  try {
    const doc = await payload.update({ collection: 'job-openings', id, data, user, overrideAccess: true, depth: 0 })
    invalidateRoleCache()
    return json({ ok: true, status: doc.status, applicationCap: doc.applicationCap ?? null })
  } catch (err) {
    logError('admin_role_update_failed', err, { roleId: id })
    return json({ ok: false, error: 'Couldn’t update the role.' }, 500)
  }
}
