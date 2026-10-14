import type { Payload } from 'payload'
import { mergeReviews, type Decision } from './review'

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
 */
export async function recomputeReview(payload: Payload, applicationId: number) {
  const res = await payload.find({
    collection: 'application-reviews',
    where: { application: { equals: applicationId } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { decision: true },
  })
  const merged = mergeReviews(res.docs as { decision: Decision }[])
  await payload.update({
    collection: 'applications',
    id: applicationId,
    data: { reviewState: merged.state, reviewDecision: merged.decision },
    overrideAccess: true,
    depth: 0,
    select: { reviewState: true },
  })
  return merged
}
