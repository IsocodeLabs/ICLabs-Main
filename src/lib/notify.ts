import { Resend } from 'resend'

/**
 * Founder notification emails — contact/quiz leads (afterChange hooks) and the
 * daily careers digest (cron). Best-effort only: a failed send must never
 * fail the actual DB write, so every call site wraps this and swallows errors.
 *
 * Needs RESEND_API_KEY in the environment; sends nothing (silently, by design)
 * if it's absent, so local dev without a key never breaks. RESEND_FROM_EMAIL
 * must be on a domain verified in the Resend dashboard — until isocodelabs.com
 * is verified there, sends will fail even with a valid key.
 */
const NOTIFY_RECIPIENTS = ['aryan@isocodelabs.com', 'devansh@isocodelabs.com']
const FROM = process.env.RESEND_FROM_EMAIL || 'Isocode Notifications <notifications@isocodelabs.com>'

let client: Resend | null = null
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!client) client = new Resend(key)
  return client
}

export async function notifyFounders(subject: string, html: string): Promise<void> {
  const resend = getClient()
  if (!resend) {
    console.warn('[notify] RESEND_API_KEY not set — skipping notification:', subject)
    return
  }
  try {
    await resend.emails.send({ from: FROM, to: NOTIFY_RECIPIENTS, subject, html })
  } catch (err) {
    console.error('[notify] failed to send notification email:', err)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function row(label: string, value: string): string {
  if (!value) return ''
  return `<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap;vertical-align:top">${escapeHtml(
    label,
  )}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`
}

export function leadNotificationHtml(opts: {
  kind: string
  name: string
  email: string
  company?: string
  note?: string
}): string {
  const kindLabel = opts.kind === 'shortQuiz' ? 'Quiz submission' : 'Contact enquiry'
  return `<h2 style="font-family:sans-serif">${escapeHtml(kindLabel)}</h2>
    <table style="font-family:sans-serif;font-size:14px">
      ${row('Name', opts.name)}
      ${row('Email', opts.email)}
      ${row('Company', opts.company ?? '')}
      ${row('Note', opts.note ?? '')}
    </table>
    <p style="font-family:sans-serif;font-size:13px;color:#888">Full detail — including quiz answers — is in the admin under Ops → Lead Submissions.</p>`
}

/** Founders' daily careers digest — counts only (no applicant PII in email). */
export function careersDigestHtml(opts: {
  since: string
  rows: { title: string; last24h: number; total: number; shortlisted: number; status: string }[]
  adminUrl: string
}): string {
  const total24 = opts.rows.reduce((s, r) => s + r.last24h, 0)
  const cells = opts.rows
    .map(
      (r) =>
        `<tr><td style="padding:6px 16px 6px 0">${escapeHtml(r.title)}</td><td style="padding:6px 16px 6px 0;color:#666">${escapeHtml(
          r.status,
        )}</td><td style="padding:6px 16px 6px 0;text-align:right"><b>${r.last24h}</b></td><td style="padding:6px 16px 6px 0;text-align:right">${r.total}</td><td style="padding:6px 0;text-align:right">${r.shortlisted}</td></tr>`,
    )
    .join('')
  return `<h2 style="font-family:sans-serif">Careers — ${total24} new application${total24 === 1 ? '' : 's'} in the last 24 hours</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
      <tr style="color:#888;font-size:12px;text-align:left"><th style="padding:0 16px 6px 0">Role</th><th style="padding:0 16px 6px 0">Status</th><th style="padding:0 16px 6px 0">Last 24h</th><th style="padding:0 16px 6px 0">This cycle</th><th style="padding:0 0 6px">Shortlisted</th></tr>
      ${cells}
    </table>
    <p style="font-family:sans-serif;font-size:14px"><a href="${escapeHtml(opts.adminUrl)}">Open the screening view →</a></p>
    <p style="font-family:sans-serif;font-size:12px;color:#888">Since ${escapeHtml(opts.since)}. Applicant details stay in the admin.</p>`
}
