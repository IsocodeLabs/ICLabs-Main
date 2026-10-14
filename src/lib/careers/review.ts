/**
 * Two-founder reviews of an applicant. Each founder records their own review
 * (a decision, optionally a rating and a note); the merged state is derived from
 * those reviews. Used by the server (which stores the merged state on the
 * application) and the screening desk (labels). Keep this file free of server
 * imports so both sides can use it.
 */
export const DECISIONS = [
  { value: 'approve', label: 'Approve' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'reject', label: 'Reject' },
] as const

export type Decision = (typeof DECISIONS)[number]['value']

export const REVIEW_STATES = ['awaiting', 'waiting', 'agreed', 'discussion', 'undecided'] as const
export type ReviewState = (typeof REVIEW_STATES)[number]

export type MergedReview = { state: ReviewState; decision: 'approve' | 'reject' | null }

/**
 * - no reviews                              → awaiting   (nobody has reviewed yet)
 * - one review                              → waiting    (the other founder still to review)
 * - two or more, firm decisions all agree   → agreed     (approve | reject)
 * - two or more, approve AND reject present → discussion (separate them, talk it through)
 * - two or more, every review is "maybe"    → undecided
 *
 * "Maybe" never overrides a firm decision: approve + maybe is agreed approve.
 */
export function mergeReviews(reviews: { decision: Decision }[]): MergedReview {
  if (reviews.length === 0) return { state: 'awaiting', decision: null }
  if (reviews.length === 1) return { state: 'waiting', decision: null }

  const firm = new Set(reviews.map((r) => r.decision).filter((d) => d !== 'maybe'))
  if (firm.has('approve') && firm.has('reject')) return { state: 'discussion', decision: null }
  if (firm.has('approve')) return { state: 'agreed', decision: 'approve' }
  if (firm.has('reject')) return { state: 'agreed', decision: 'reject' }
  return { state: 'undecided', decision: null }
}

/** Short label for a merged state, e.g. "Agreed · approve". */
export function reviewLabel(state: string | null | undefined, decision?: string | null): string {
  switch (state) {
    case 'waiting':
      return 'Waiting for 2nd review'
    case 'agreed':
      return decision ? `Agreed · ${decision}` : 'Agreed'
    case 'discussion':
      return 'Discussion'
    case 'undecided':
      return 'Undecided'
    default:
      return 'Not reviewed'
  }
}
