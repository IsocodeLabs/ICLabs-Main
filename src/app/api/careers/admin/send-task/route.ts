import { buildWhere, filtersFrom, requireAdmin } from '@/lib/careers/admin'
import {
  fillTemplate,
  mailConfigured,
  MAX_PER_SEND,
  sendBatch,
  TASK_TAG,
  type Outgoing,
} from '@/lib/careers/applicantMail'
import { hashId } from '@/lib/careers/crypto'
import { logError, logInfo } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'

export const dynamic = 'force-dynamic'

/** People the founders have rejected or who withdrew are never emailed. */
const NEVER_EMAIL_STAGES = new Set(['rejected', 'withdrawn'])

// one send at a time per server instance — stops a double click emailing twice
let sending = false

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/**
 * Emails the task to applicants — the selected ids, or everything matching a
 * filter that names a role. `preview: true` returns who would receive it and a
 * rendered sample, and sends nothing. Each person who is sent it is tagged
 * `task-sent`, and is skipped next time unless `resend: true`.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload, user } = auth

  const body = (await req.json().catch(() => ({}))) as {
    ids?: unknown[]
    all?: boolean
    filters?: Record<string, string>
    subject?: unknown
    body?: unknown
    preview?: boolean
    resend?: boolean
  }

  const subject = str(body.subject, 160)
  const text = str(body.body, 8000)
  if (!subject) return json({ ok: false, error: 'Add a subject line.' }, 400)
  if (!text) return json({ ok: false, error: 'Add the message.' }, 400)

  const ids = (Array.isArray(body.ids) ? body.ids : [])
    .filter((n): n is number => Number.isInteger(n))
    .slice(0, 1000)
  const filters = filtersFrom(body.filters ?? {})
  if (body.all) {
    // "everyone matching" must at least name a role — never a blanket send
    if (!filters.role) return json({ ok: false, error: 'Pick a role in the filters first.' }, 400)
  } else if (ids.length === 0) {
    return json({ ok: false, error: 'Nobody selected.' }, 400)
  }

  if (!mailConfigured()) {
    return json(
      { ok: false, error: 'Email isn’t connected yet — RESEND_API_KEY is not set on the server.' },
      503,
    )
  }

  try {
    const found = await payload.find({
      collection: 'applications',
      where: body.all ? buildWhere(filters) : { id: { in: ids } },
      limit: 1000,
      depth: 0,
      pagination: false,
      overrideAccess: true,
      select: { name: true, email: true, roleTitle: true, stage: true, tags: true },
    })

    const skipped = { stage: 0, alreadySent: 0 }
    const eligible = found.docs.filter((d) => {
      if (NEVER_EMAIL_STAGES.has(String(d.stage))) {
        skipped.stage++
        return false
      }
      if (!body.resend && (d.tags ?? []).includes(TASK_TAG)) {
        skipped.alreadySent++
        return false
      }
      return true
    })

    const outgoing: (Outgoing & { id: number; tags: string[] })[] = eligible.map((d) => {
      const vars = { name: d.name ?? '', role: d.roleTitle || 'the role' }
      return {
        id: d.id,
        tags: d.tags ?? [],
        to: d.email,
        subject: fillTemplate(subject, vars),
        text: fillTemplate(text, vars),
      }
    })

    if (body.preview) {
      const first = outgoing[0]
      return json({
        ok: true,
        recipients: outgoing.length,
        skipped,
        sample: first ? { to: first.to, subject: first.subject, text: first.text } : null,
        limit: MAX_PER_SEND,
      })
    }

    if (outgoing.length === 0) return json({ ok: true, sent: 0, failed: 0, skipped })
    if (outgoing.length > MAX_PER_SEND) {
      return json(
        {
          ok: false,
          error: `That’s ${outgoing.length} people — one send is limited to ${MAX_PER_SEND}. Narrow the selection and send in parts.`,
        },
        400,
      )
    }

    if (sending) return json({ ok: false, error: 'A send is already in progress — wait a moment.' }, 409)
    sending = true
    try {
      const result = await sendBatch(outgoing.map(({ to, subject: s, text: t }) => ({ to, subject: s, text: t })))
      const okRows = outgoing.filter((_, i) => result.sent[i])

      // remember who has it, a few at a time
      for (let i = 0; i < okRows.length; i += 10) {
        await Promise.all(
          okRows.slice(i, i + 10).map((r) =>
            payload.update({
              collection: 'applications',
              id: r.id,
              data: { tags: [...new Set([...r.tags, TASK_TAG])] },
              user,
              overrideAccess: true,
              depth: 0,
              select: { tags: true },
            }),
          ),
        )
      }

      logInfo('task_emailed', {
        actor: hashId(String(user.id)),
        sent: okRows.length,
        failed: outgoing.length - okRows.length,
        skippedStage: skipped.stage,
        skippedSent: skipped.alreadySent,
      })

      if (result.error) {
        return json({ ok: false, error: `Resend refused the send: ${result.error}` }, 502)
      }
      return json({ ok: true, sent: okRows.length, failed: outgoing.length - okRows.length, skipped })
    } finally {
      sending = false
    }
  } catch (err) {
    logError('task_email_failed', err, { actor: hashId(String(user.id)) })
    return json({ ok: false, error: 'Couldn’t send the task emails.' }, 500)
  }
}
