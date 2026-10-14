import type { Payload } from 'payload'
import type { User } from '@/payload-types'
import { agreedStage, AUTO_STAGE_FROM, mergeReviews, type Decision } from './review'

/** One founder's review, shaped for the screening desk. */
export type ReviewRow = {
  reviewerId: number
  reviewer: string
  decision: Decision
  rating: number | null
  note: string
  at: string
}

/** Every review for these applicants, grouped by applicant id. One query per page. */
export async function loadReviews(payload: Payload, applicationIds: number[]): Promise<Map<number, ReviewRow[]>> {
  const out = new Map<number, ReviewRow[]>()
  if (applicationIds.length === 0) return out

  const res = await payload.find({
    collection: 'application-reviews',
    where: { application: { in: applicationIds } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    sort: 'createdAt',
  })

  // reviewer names: one lookup for everyone who appears in these reviews
  const reviewerIds = [...new Set(res.docs.map((r) => Number(r.reviewer)))]
  const users = reviewerIds.length
    ? await payload.find({
        collection: 'users',
        where: { id: { in: reviewerIds } },
        pagination: false,
        depth: 0,
        overrideAccess: true,
        select: { name: true, email: true },
      })
    : { docs: [] }
  const name = new Map(users.docs.map((u) => [u.id, u.name || u.email]))

  for (const r of res.docs) {
    const appId = Number(r.application)
    const reviewerId = Number(r.reviewer)
    const list = out.get(appId) ?? []
    list.push({
      reviewerId,
      reviewer: name.get(reviewerId) || 'Reviewer',
      decision: r.decision as Decision,
      rating: r.rating ?? null,
      note: r.note ?? '',
      at: r.updatedAt,
    })
    out.set(appId, list)
  }
  return out
}

/**
 * Re-merge an applicant's reviews and store the result on the application, so
 * the list can filter and sort on it without reading every review.
 *
 * When both founders firmly agree the stage follows: both approve → Shortlisted,
 * both reject → Rejected. Only applicants still in the screening phase move
 * (applied / shortlisted / rejected); someone already in process, offered,
 * hired or withdrawn is left alone. The move goes through the collection hook
 * as the founder who just reviewed, so the stage history shows who and when.
 * Nothing is emailed to the applicant.
 */
export async function recomputeReview(payload: Payload, applicationId: number, user?: User) {
  const res = await payload.find({
    collection: 'application-reviews',
    where: { application: { equals: applicationId } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { decision: true },
  })
  const reviews = res.docs as { decision: Decision }[]
  const merged = mergeReviews(reviews)

  let stage: 'shortlisted' | 'rejected' | null = null
  const target = agreedStage(reviews)
  if (target) {
    const current = await payload
      .findByID({ collection: 'applications', id: applicationId, depth: 0, overrideAccess: true, select: { stage: true } })
      .catch(() => null)
    const from = String(current?.stage ?? 'applied')
    if (from !== target && (AUTO_STAGE_FROM as readonly string[]).includes(from)) stage = target
  }

  await payload.update({
    collection: 'applications',
    id: applicationId,
    data: { reviewState: merged.state, reviewDecision: merged.decision, ...(stage ? { stage } : {}) },
    ...(user ? { user } : {}),
    overrideAccess: true,
    depth: 0,
    select: { reviewState: true },
  })
  return { ...merged, stage }
}
