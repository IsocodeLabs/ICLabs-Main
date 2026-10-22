'use client'

import { useMemo, useState } from 'react'
import type { Filters } from '@/lib/careers/admin'
import styles from './Screening.module.css'

/**
 * "Email task" — write the task once, preview exactly who gets it and what
 * they'll read, then send. Applicants who were already sent it are skipped, and
 * rejected / withdrawn people are never emailed (the server enforces both).
 * Sending is handed to a background job that goes out in batches of `limit`.
 */

type Scope = { ids?: number[]; all?: boolean; filters?: Filters }

type Preview = {
  recipients: number
  skipped: { stage: number; alreadySent: number }
  sample: { to: string; subject: string; text: string } | null
  limit: number
  recipientIds: number[]
}

/** What the desk's background job needs to send exactly what was previewed. */
export type TaskSend = { recipientIds: number[]; subject: string; body: string; resend: boolean; limit: number }

const DEFAULT_SUBJECT = 'Next step: your {{role}} task at Isocode Labs'

const DEFAULT_BODY = `Hi {{name}},

Thanks for applying for the {{role}} role at Isocode Labs. We'd like to see how you work, so here is the next step: a short task.

THE TASK
[Describe the task here: what to do, what to hand in, and in what format]

DEADLINE
[Date and time, IST]

HOW TO SUBMIT
Reply to this email with [a link or a file].

If anything is unclear, just reply. A real person reads it.

Team Isocode Labs`

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch('/api/careers/admin/send-task', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', 'x-careers-admin': '1' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) throw new Error(data.error || `Request failed (${res.status})`)
  return data as T
}

export function TaskEmailDialog({
  scope,
  count,
  roleLabel,
  onClose,
  onSend,
}: {
  scope: Scope
  /** how many people the scope covers, before the server's skips */
  count: number
  roleLabel: string
  onClose: () => void
  onSend: (send: TaskSend) => void
}) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [message, setMessage] = useState(DEFAULT_BODY)
  const [resend, setResend] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewKey, setPreviewKey] = useState('')
  const [reviewed, setReviewed] = useState(false)
  const [working, setWorking] = useState<'preview' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const key = `${subject}\n${message}\n${resend}`
  const fresh = preview !== null && previewKey === key
  // anything still in [square brackets] is a placeholder nobody filled in
  const placeholders = useMemo(() => message.match(/\[[^\]\n]{3,}\]/g) ?? [], [message])
  const payload = { ...scope, subject, body: message, resend }

  async function runPreview() {
    setWorking('preview')
    setError(null)
    setReviewed(false)
    try {
      const p = await post<Preview & { ok: true }>({ ...payload, preview: true })
      setPreview(p)
      setPreviewKey(key)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setWorking(null)
    }
  }

  function send() {
    if (!preview) return
    onSend({ recipientIds: preview.recipientIds, subject, body: message, resend, limit: preview.limit })
  }

  const canSend =
    fresh && reviewed && preview!.recipients > 0 && placeholders.length === 0 && working === null

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={() => working === null && onClose()}>
      <div
        className={`${styles.modal} ${styles.taskModal}`}
        role="dialog"
        aria-modal
        aria-labelledby="task-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="task-title" className={styles.h2}>
          Email the task
        </h2>
        <p>
          To <b>{count}</b> applicant{count === 1 ? '' : 's'} · <b>{roleLabel}</b>. Sent from Isocode Careers; replies
          go to the founders. <code>{'{{name}}'}</code> is their first name and <code>{'{{role}}'}</code> the role they
          applied for.
        </p>

        <label className={styles.modalField}>
          Subject
          <input value={subject} maxLength={160} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className={styles.modalField}>
          Message
          <textarea
            className={styles.taskBody}
            value={message}
            maxLength={8000}
            rows={14}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>

        {placeholders.length > 0 && (
          <p className={styles.errorText}>
            Replace the placeholder{placeholders.length === 1 ? '' : 's'} first: {placeholders.slice(0, 3).join('  ·  ')}
          </p>
        )}

        <label className={styles.inline}>
          <input type="checkbox" checked={resend} onChange={(e) => setResend(e.target.checked)} />
          Also email people who were already sent a task
        </label>

        {fresh && preview && (
          <div className={styles.previewBox}>
            <p>
              <b>{preview.recipients}</b> will receive it
              {preview.skipped.alreadySent > 0 && <> · {preview.skipped.alreadySent} skipped (already sent)</>}
              {preview.skipped.stage > 0 && <> · {preview.skipped.stage} skipped (rejected / withdrawn)</>}
              {preview.recipients > preview.limit && (
                <span className={styles.muted}> · goes out in the background, {preview.limit} at a time</span>
              )}
            </p>
            {preview.sample && (
              <>
                <p className={styles.muted}>
                  Sample, as <b>{preview.sample.to}</b> will read it:
                </p>
                <pre className={styles.previewText}>
                  {preview.sample.subject}
                  {'\n\n'}
                  {preview.sample.text}
                </pre>
              </>
            )}
            <label className={styles.inline}>
              <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />
              I’ve read the sample and it’s ready to go
            </label>
          </div>
        )}

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.modalActions}>
          <button type="button" className={styles.btn} disabled={working !== null} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.btn}
            disabled={working !== null || !subject.trim() || !message.trim()}
            onClick={() => void runPreview()}
          >
            {working === 'preview' ? 'Checking…' : fresh ? 'Refresh preview' : 'Preview'}
          </button>
          <button type="button" className={styles.primaryBtn} disabled={!canSend} onClick={send}>
            {fresh && preview ? `Send to ${preview.recipients}` : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
