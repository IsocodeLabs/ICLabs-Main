import { loadRow, requireAdmin } from '@/lib/careers/admin'
import { logError } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'
import { recomputeReview } from '@/lib/careers/reviews'
import { DECISIONS, type Decision } from '@/lib/careers/review'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Save the signed-in founder's own review of one applicant. Each founder has one
 * review per applicant: saving again updates it. Both founders can review every
 * applicant. The merged state is recomputed right after the save.
 */
export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload, user } = auth
  const id = Number((await params).id)
  const body = (await req.json().catch(() => ({}))) as {
    decision?: string
    rating?: number | null
    note?: string
  }

  if (!DECISIONS.some((d) => d.value === body.decision)) {
    return json({ ok: false, error: 'Choose approve, maybe or reject.' }, 400)
  }
  let rating: number | null = null
  if (body.rating !== null && body.rating !== undefined) {
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return json({ ok: false, error: 'Rating must be 1–5' }, 400)
    }
    rating = body.rating
  }
  const note = String(body.note ?? '').slice(0, 2000)
  const decision = body.decision as Decision

  try {
    const app = await payload.findByID({ collection: 'applications', id, depth: 0, overrideAccess: true }).catch(() => null)
    if (!app) return json({ ok: false, error: 'Applicant not found' }, 404)

    const mine = await payload.find({
      collection: 'application-reviews',
      where: { and: [{ application: { equals: id } }, { reviewer: { equals: user.id } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const data = { decision, rating, note }
    if (mine.docs[0]) {
      await payload.update({ collection: 'application-reviews', id: mine.docs[0].id, data, overrideAccess: true })
    } else {
      await payload.create({
        collection: 'application-reviews',
        data: { application: id, reviewer: user.id, ...data },
        overrideAccess: true,
      })
    }
    await recomputeReview(payload, id)
    return json({ ok: true, row: await loadRow(payload, id) })
  } catch (err) {
    logError('review_save_failed', err, { applicationId: id })
    return json({ ok: false, error: 'Couldn’t save your review — try again.' }, 500)
  }
}
