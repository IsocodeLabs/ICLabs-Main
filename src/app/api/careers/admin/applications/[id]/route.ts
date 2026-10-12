import { APPLICATION_STAGES } from '@/collections/Applications'
import { requireAdmin, ROW_SELECT, toRow } from '@/lib/careers/admin'
import { hashId } from '@/lib/careers/crypto'
import { logError, logInfo } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'
import { getStorage } from '@/lib/careers/storage'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** Screening edits: rating, stage, tags, internal notes. */
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload, user } = auth
  const id = Number((await params).id)
  const body = (await req.json().catch(() => ({}))) as {
    rating?: number | null
    stage?: string
    tags?: string[]
    notes?: string
  }
  const data: Record<string, unknown> = {}
  if ('rating' in body) {
    if (body.rating === null) data.rating = null
    else if (Number.isInteger(body.rating) && body.rating! >= 1 && body.rating! <= 5) data.rating = body.rating
    else return json({ ok: false, error: 'Rating must be 1–5' }, 400)
  }
  if (body.stage !== undefined) {
    if (!APPLICATION_STAGES.some((s) => s.value === body.stage)) return json({ ok: false, error: 'Unknown stage' }, 400)
    data.stage = body.stage
  }
  if (body.tags !== undefined) {
    data.tags = [...new Set((body.tags ?? []).map((t) => String(t).trim().toLowerCase().slice(0, 40)).filter(Boolean))].slice(0, 20)
  }
  if (body.notes !== undefined) data.notes = String(body.notes).slice(0, 5000)

  try {
    const doc = await payload.update({
      collection: 'applications',
      id,
      data,
      user,
      overrideAccess: true,
      depth: 1,
      select: ROW_SELECT,
      populate: { users: { name: true, email: true } },
    })
    return json({ ok: true, row: toRow(doc as never) })
  } catch (err) {
    logError('admin_update_failed', err, { applicationId: id })
    return json({ ok: false, error: 'Couldn’t save that change.' }, 500)
  }
}

/**
 * "Delete applicant data" — the ONLY hard delete, for an applicant's deletion
 * request (DPDP). Requires typing the applicant's email to confirm; removes the
 * CV (every stored version) and the record, and writes an audit entry with no
 * PII (id + salted email hash).
 */
export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload, user } = auth
  const id = Number((await params).id)
  const body = (await req.json().catch(() => ({}))) as { confirm?: string; reason?: string }

  try {
    const app = await payload.findByID({ collection: 'applications', id, depth: 0, overrideAccess: true })
    if (!app) return json({ ok: false, error: 'Not found' }, 404)
    if (String(body.confirm || '').trim().toLowerCase() !== String(app.email).toLowerCase()) {
      return json({ ok: false, error: 'Type the applicant’s email exactly to confirm.' }, 400)
    }

    if (app.objectKey) await getStorage().purge(app.objectKey)
    if (app.resume) {
      const resumeId = typeof app.resume === 'object' ? app.resume.id : app.resume
      await payload.delete({ collection: 'resumes', id: resumeId, overrideAccess: true }).catch(() => {})
    }
    await payload.delete({ collection: 'applications', id, overrideAccess: true })
    await payload.create({
      collection: 'careers-audit-log',
      overrideAccess: true,
      data: {
        action: 'applicant_deleted',
        applicationId: String(id),
        emailHash: hashId(String(app.email).toLowerCase()),
        actor: user.id,
        detail: {
          role: app.role,
          cycle: app.cycle,
          hadCv: Boolean(app.objectKey || app.resume),
          reason: String(body.reason || 'Applicant request').slice(0, 200),
        },
      },
    })
    logInfo('applicant_deleted', { applicationId: id })
    return json({ ok: true })
  } catch (err) {
    logError('admin_delete_failed', err, { applicationId: id })
    return json({ ok: false, error: 'Deletion failed — nothing was audit-logged; try again.' }, 500)
  }
}
