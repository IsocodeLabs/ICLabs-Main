'use client'

import { useEffect, useState } from 'react'
import type { Row } from '@/lib/careers/admin'
import { DECISIONS, reviewLabel, type Decision } from '@/lib/careers/review'
import styles from './Screening.module.css'

export type Viewer = { id: number; name: string }

const DECISION_LABEL = Object.fromEntries(DECISIONS.map((d) => [d.value, d.label])) as Record<string, string>

const fmt = (s: string) =>
  new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Every founder reviews every applicant. Each review is separate; the merged
 *  result shows up as a single state (agreed / discussion / waiting). */
export function ReviewPanel({
  row,
  viewer,
  onSave,
}: {
  row: Row
  viewer: Viewer | null
  onSave: (d: { decision: Decision; rating: number | null; note: string }) => Promise<void>
}) {
  const mine = viewer ? row.reviews.find((r) => r.reviewerId === viewer.id) ?? null : null
  const [decision, setDecision] = useState<Decision | null>(mine?.decision ?? null)
  const [rating, setRating] = useState<number | null>(mine?.rating ?? null)
  const [note, setNote] = useState(mine?.note ?? '')
  const [saving, setSaving] = useState(false)

  // show what's saved whenever the saved review changes (saved here, or elsewhere)
  useEffect(() => {
    setDecision(mine?.decision ?? null)
    setRating(mine?.rating ?? null)
    setNote(mine?.note ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine?.decision, mine?.rating, mine?.note, mine?.at])

  const dirty = mine
    ? decision !== mine.decision || rating !== mine.rating || note !== mine.note
    : decision !== null

  const banner = (() => {
    switch (row.reviewState) {
      case 'agreed':
        return `Agreed: ${DECISION_LABEL[row.reviewDecision ?? ''] ?? row.reviewDecision}`
      case 'discussion':
        return 'Discussion: the reviews disagree. Talk it through before moving this applicant.'
      case 'waiting':
        return 'One review in. Waiting for the second review.'
      case 'undecided':
        return 'Everyone said maybe. Decide together.'
      default:
        return 'Nobody has reviewed this applicant yet.'
    }
  })()

  async function save() {
    if (!decision || saving) return
    setSaving(true)
    try {
      await onSave({ decision, rating, note })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.reviewPanel} aria-label="Reviews">
      <div className={styles.reviewBanner} data-state={row.reviewState}>
        <span className={styles.review} data-state={row.reviewState}>
          {reviewLabel(row.reviewState, row.reviewDecision)}
        </span>
        <span>{banner}</span>
      </div>

      {row.reviews.length > 0 && (
        <ul className={styles.reviewList}>
          {row.reviews.map((r) => (
            <li key={r.reviewerId}>
              <b>{r.reviewer}</b>
              {viewer && r.reviewerId === viewer.id ? ' (you)' : ''}: {DECISION_LABEL[r.decision] ?? r.decision}
              {r.rating ? ` · ${'★'.repeat(r.rating)}` : ''}
              {r.note && <span className={styles.reviewNote}> — {r.note}</span>}
              <span className={styles.reviewMeta}> · {fmt(r.at)}</span>
            </li>
          ))}
        </ul>
      )}

      {viewer && (
        <div className={styles.reviewForm}>
          <div className={styles.decisionRow} role="radiogroup" aria-label="Your decision">
            {DECISIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                role="radio"
                aria-checked={decision === d.value}
                data-decision={d.value}
                className={`${styles.decisionBtn} ${decision === d.value ? styles.decisionBtnOn : ''}`}
                onClick={() => setDecision(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className={styles.ratingRow} role="radiogroup" aria-label="Your rating (optional)">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                className={`${styles.star} ${rating && n <= rating ? styles.starOn : ''}`}
                onClick={() => setRating(rating === n ? null : n)}
                title={`Your rating: ${n}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className={styles.notes}
            rows={2}
            placeholder="Your note on this applicant (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className={styles.reviewActions}>
            <button type="button" className={styles.reviewSave} disabled={!decision || !dirty || saving} onClick={save}>
              {saving ? 'Saving…' : mine ? 'Update my review' : 'Save my review'}
            </button>
            {mine && !dirty && <span className={styles.muted}>Your review is saved.</span>}
          </div>
        </div>
      )}
    </section>
  )
}
