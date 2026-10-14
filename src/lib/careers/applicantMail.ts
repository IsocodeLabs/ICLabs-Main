import { Resend } from 'resend'

/**
 * Emails TO applicants (the founders' "Email task" action in the screening
 * desk). Kept apart from lib/notify.ts, which only ever emails the founders.
 *
 * Sent through Resend, from a careers address on the verified domain; replies
 * go to the founders. Needs RESEND_API_KEY and a verified isocodelabs.com in
 * Resend — without them nothing is sent and the caller is told why.
 *
 * Privacy: bodies are applicant-specific, so never log them (or addresses).
 */

/** Marks an applicant who has already been sent the task, so a second send skips them. */
export const TASK_TAG = 'task-sent'

/** Resend's free plan allows 100 emails a day; one send is capped at the same. */
export const MAX_PER_SEND = 100

const FROM = () => process.env.RESEND_CAREERS_FROM || 'Isocode Careers <careers@isocodelabs.com>'
const REPLY_TO = () =>
  (process.env.RESEND_CAREERS_REPLY_TO || 'aryan@isocodelabs.com,devansh@isocodelabs.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY)

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** First word of a full name — "Aryan Malhotra" → "Aryan". */
export const firstName = (full: string) => full.trim().split(/\s+/)[0] || full.trim()

/**
 * Fills {{name}} (first name), {{fullName}} and {{role}}. Unknown {{tokens}}
 * are left as typed so a typo is visible in the preview rather than blank.
 */
export function fillTemplate(template: string, vars: { name: string; role: string }): string {
  return template.replace(/\{\{\s*(name|fullName|role)\s*\}\}/gi, (_, key: string) => {
    switch (key.toLowerCase()) {
      case 'name':
        return firstName(vars.name)
      case 'fullname':
        return vars.name.trim()
      default:
        return vars.role
    }
  })
}

/** Plain text → simple, client-safe HTML (paragraphs + line breaks, URLs linkified). */
export function toHtml(text: string): string {
  const paras = text
    .trim()
    .split(/\n{2,}/)
    .map((p) => {
      const safe = escapeHtml(p).replace(
        /(https?:\/\/[^\s<]+)/g,
        (url) => `<a href="${url}" style="color:#141210">${url}</a>`,
      )
      return `<p style="margin:0 0 16px">${safe.replace(/\n/g, '<br>')}</p>`
    })
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#141210;max-width:560px">${paras.join('')}</div>`
}

export type Outgoing = { to: string; subject: string; text: string }

/** Sends the batch; `sent[i]` is whether item i was accepted for delivery. Never throws. */
export async function sendBatch(
  items: Outgoing[],
): Promise<{ sent: boolean[]; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { sent: items.map(() => false), error: 'RESEND_API_KEY is not set on the server.' }
  if (items.length === 0) return { sent: [] }
  try {
    const resend = new Resend(key)
    const from = FROM()
    const replyTo = REPLY_TO()
    const res = await resend.batch.send(
      items.map((m) => ({
        from,
        to: [m.to],
        replyTo,
        subject: m.subject,
        text: m.text,
        html: toHtml(m.text),
      })),
    )
    if (res.error) return { sent: items.map(() => false), error: res.error.message }
    return { sent: items.map(() => true) }
  } catch (err) {
    return { sent: items.map(() => false), error: err instanceof Error ? err.message : 'Send failed.' }
  }
}
