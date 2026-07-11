import { Resend } from 'resend'

/**
 * Founder notification emails — fired from collection afterChange hooks when a
 * new lead or application comes in. Best-effort only: a failed send must never
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

export function applicationNotificationHtml(opts: {
  name: string
  email: string
  roleTitle: string
  college?: string
  portfolioUrl?: string
}): string {
  return `<h2 style="font-family:sans-serif">New application — ${escapeHtml(opts.roleTitle || 'Careers')}</h2>
    <table style="font-family:sans-serif;font-size:14px">
      ${row('Name', opts.name)}
      ${row('Email', opts.email)}
      ${row('College', opts.college ?? '')}
      ${row('Portfolio', opts.portfolioUrl ?? '')}
    </table>
    <p style="font-family:sans-serif;font-size:13px;color:#888">Résumé and full detail are in the admin under Careers → Applications.</p>`
}
