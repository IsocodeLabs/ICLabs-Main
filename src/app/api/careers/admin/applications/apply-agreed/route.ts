import { requireAdmin } from '@/lib/careers/admin'
import { careersConfig } from '@/lib/careers/config'
import { hashId } from '@/lib/careers/crypto'
import { logError, logInfo } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'
import { agreedStage, AUTO_STAGE_FROM } from '@/lib/careers/review'
import { loadReviews } from '@/lib/careers/reviews'

export const dynamic = 'force-dynamic'

/**
 * One-off catch-up for the "both founders agree → the stage follows" rule.
 *
 * The rule runs whenever a review is saved, so applicants whose second review
 * was saved *before* it existed still sit at "Applied" with an "Agreed" label.
 * This applies the same rule to them: everyone-approves → Shortlisted,
 * everyone-rejects → Rejected, only for applicants still in screening
 * (applied / shortlisted / rejected). `dryRun: true` only counts.
 *
 * `limit` moves at most that many and reports `remaining`, so the desk can run
 * it in small chunks with a progress bar. Moved rows drop out of the query, so
 * each call simply picks up the next ones.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload, user } = auth
  const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean; cycle?: string; limit?: number }
  const limit = Number.isInteger(body.limit) && body.limit! > 0 ? Math.min(body.limit!, 500) : Infinity
  const cycle = typeof body.cycle === 'string' && body.cycle ? body.cycle : careersConfig.cycle

  try {
    const found = await payload.find({
      collection: 'applications',
      where: {
        and: [
          { cycle: { equals: cycle } },
          { reviewState: { equals: 'agreed' } },
          { stage: { in: [...AUTO_STAGE_FROM] } },
        ],
      },
      limit: 5000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
      select: { stage: true },
    })

    const reviews = await loadReviews(
      payload,
      found.docs.map((d) => d.id),
    )

    const moves: { id: number; to: 'shortlisted' | 'rejected' }[] = []
    let heldBackByMaybe = 0
    for (const d of found.docs) {
      const target = agreedStage(reviews.get(d.id) ?? [])
      if (!target) {
        heldBackByMaybe++ // "agreed" on the list, but not every review is a firm yes/no
        continue
      }
      if (String(d.stage) !== target) moves.push({ id: d.id, to: target })
    }

    const toShortlist = moves.filter((m) => m.to === 'shortlisted').length
    const toReject = moves.filter((m) => m.to === 'rejected').length
    const summary = { cycle, toShortlist, toReject, heldBackByMaybe, alreadyCorrect: found.docs.length - moves.length - heldBackByMaybe }

    if (body.dryRun) return json({ ok: true, dryRun: true, ...summary })

    // a few at a time, through the collection hook, as the founder who ran it
    const batch = moves.slice(0, limit)
    for (let i = 0; i < batch.length; i += 10) {
      await Promise.all(
        batch.slice(i, i + 10).map((m) =>
          payload.update({
            collection: 'applications',
            id: m.id,
            data: { stage: m.to },
            user,
            overrideAccess: true,
            depth: 0,
            select: { stage: true },
          }),
        ),
      )
    }
    logInfo('apply_agreed', { actor: hashId(String(user.id)), cycle, toShortlist, toReject, heldBackByMaybe })
    return json({ ok: true, dryRun: false, ...summary, moved: batch.length, remaining: moves.length - batch.length })
  } catch (err) {
    logError('apply_agreed_failed', err, { actor: hashId(String(user.id)) })
    return json({ ok: false, error: 'Couldn’t apply the agreed reviews.' }, 500)
  }
}
