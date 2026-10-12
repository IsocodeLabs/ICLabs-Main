import { careersConfig } from '@/lib/careers/config'
import { verifyUploadTicket } from '@/lib/careers/crypto'
import { payloadInstance } from '@/lib/careers/db'
import { logError, logInfo, logWarn } from '@/lib/careers/log'
import { rateLimit } from '@/lib/careers/rateLimit'
import { clientIp, json } from '@/lib/careers/request'
import { findOpenRole, invalidateRoleCache } from '@/lib/careers/roles'
import { applicationKey, getStorage, PENDING_KEY_RE } from '@/lib/careers/storage'
import {
  RESUME_MAX_BYTES,
  validateApplication,
  type ApplicationInput,
} from '@/lib/careers/validation'
import type { RoleKind } from '@/lib/seed-data'
import type { Payload } from 'payload'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const DUPLICATE_MESSAGE =
  'You’ve already applied for this role. Write to us if you need to update your CV.'
const SERVER_ERROR = 'Something went wrong on our side — nothing you did. Your answers are saved; please try again.'

async function findExisting(payload: Payload, submissionId: string, dedupeKey?: string) {
  const res = await payload.find({
    collection: 'applications',
    where: dedupeKey
      ? { or: [{ submissionId: { equals: submissionId } }, { dedupeKey: { equals: dedupeKey } }] }
      : { submissionId: { equals: submissionId } },
    limit: 2,
    depth: 0,
    overrideAccess: true,
    select: { submissionId: true, dedupeKey: true },
  })
  return {
    sameSubmission: res.docs.some((d) => d.submissionId === submissionId),
    duplicate: res.docs.some((d) => dedupeKey && d.dedupeKey === dedupeKey),
  }
}

/**
 * Step 2: the application itself. Does only: validate → check the uploaded
 * object → copy it to its permanent key → one DB insert → respond.
 *
 * - Idempotent on `submissionId`: a resend (double click, retry after a
 *   network blip) returns the original success, never a second row.
 * - One application per email + role + cycle (`dedupeKey`, unique index).
 * - The CV is copied to applications/{roleSlug}/{submissionId}.pdf *before*
 *   the insert, so a stored application never points at a missing file; the
 *   pending upload is removed after (and expires on its own if that fails).
 * - No emails or notifications here — the founders' daily digest is a cron.
 */
export async function POST(req: Request) {
  const started = Date.now()
  let submissionId = ''
  try {
    const body = (await req.json().catch(() => null)) as {
      submissionId?: string
      role?: string
      objectKey?: string
      ticket?: string
      website?: string
      fields?: ApplicationInput
    } | null
    if (!body) return json({ ok: false, code: 'bad_request', error: 'Something was off with that request. Please try again.' }, 400)

    // honeypot: pretend success, store nothing
    if (typeof body.website === 'string' && body.website.trim()) {
      logInfo('apply_honeypot')
      return json({ ok: true })
    }

    submissionId = String(body.submissionId || '').toLowerCase()
    const objectKey = String(body.objectKey || '')
    if (!UUID_RE.test(submissionId) || !PENDING_KEY_RE.test(objectKey)) {
      return json({ ok: false, code: 'bad_request', error: 'Something was off with that request. Please refresh and try again.' }, 400)
    }
    if (!verifyUploadTicket(objectKey, String(body.ticket || ''))) {
      return json({ ok: false, code: 'upload_expired', error: 'Your CV upload expired. Please attach it again.' }, 400)
    }

    const payload = await payloadInstance()

    const limited = await rateLimit(payload, 'submit', clientIp(req), careersConfig.rateLimitSubmit)
    if (!limited.ok) {
      return json(
        { ok: false, code: 'rate_limited', error: 'Too many attempts from this network. Please wait a few minutes and try again.' },
        429,
        { 'retry-after': String(limited.retryAfter) },
      )
    }

    // a resend of a submission that already went through → original success
    if ((await findExisting(payload, submissionId)).sameSubmission) {
      return json({ ok: true, repeat: true })
    }

    const { role, error: roleError } = await findOpenRole(payload, String(body.role || ''))
    if (!role || roleError) {
      return json({ ok: false, code: roleError ?? 'unknown_role', error: 'Applications for this role aren’t open right now.' }, 409)
    }
    const roleKind = (role.roleKind ?? 'sde') as RoleKind

    const checked = validateApplication(body.fields ?? {}, roleKind)
    if (!checked.ok) {
      return json({ ok: false, code: 'invalid', error: 'Please check the highlighted fields.', fieldErrors: checked.errors }, 422)
    }
    const data = checked.data

    const cycle = careersConfig.cycle
    const dedupeKey = `${cycle}:${role.roleKey}:${data.email}`
    if ((await findExisting(payload, submissionId, dedupeKey)).duplicate) {
      return json({ ok: false, code: 'duplicate', error: DUPLICATE_MESSAGE }, 409)
    }

    // the uploaded object: present, ≤ 5 MB, really a PDF
    const storage = getStorage()
    const meta = await storage.stat(objectKey)
    if (!meta) {
      return json({ ok: false, code: 'upload_missing', error: 'We couldn’t find your CV upload. Please attach it again.' }, 400)
    }
    if (meta.size > RESUME_MAX_BYTES || meta.size === 0) {
      return json({ ok: false, code: 'too_large', error: 'That PDF is over 5 MB — mind compressing it?' }, 400)
    }
    const head = await storage.readHead(objectKey, 5)
    if (head.toString('latin1') !== '%PDF-') {
      return json({ ok: false, code: 'not_pdf', error: 'That file isn’t a real PDF. Please export your CV as a PDF and attach it again.' }, 400)
    }

    const finalKey = applicationKey(role.slug ?? role.roleKey, submissionId)
    await storage.copy(objectKey, finalKey)

    try {
      await payload.create({
        collection: 'applications',
        overrideAccess: true,
        depth: 0,
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: role.roleKey,
          roleTitle: role.title,
          cycle,
          stage: 'applied',
          college: data.college,
          gradYear: data.gradYear,
          startDate: data.startDate,
          commitSixMonths: data.commitSixMonths,
          consentAt: new Date().toISOString(),
          linkedinUrl: data.linkedinUrl || undefined,
          githubUrl: data.githubUrl || undefined,
          portfolioUrl: data.portfolioUrl || undefined,
          projectUrl: data.projectUrl || undefined,
          pitchNote: data.pitchNote || undefined,
          why: data.why || undefined,
          interestArea: (data.interestArea || undefined) as never,
          objectKey: finalKey,
          resumeSize: meta.size,
          submissionId,
          dedupeKey,
        },
      })
    } catch (err) {
      // lost a race with a concurrent identical request? resolve by what's stored
      const existing = await findExisting(payload, submissionId, dedupeKey)
      if (existing.sameSubmission) return json({ ok: true, repeat: true })
      if (existing.duplicate) {
        // the copied CV belongs to no application — remove it again
        void storage.remove(finalKey).catch(() => {})
        return json({ ok: false, code: 'duplicate', error: DUPLICATE_MESSAGE }, 409)
      }
      throw err
    }

    void storage.remove(objectKey).catch(() => {}) // lifecycle rule is the backstop

    if (role.applicationCap) await enforceCap(payload, role.id, role.roleKey, role.applicationCap, cycle)

    logInfo('apply_ok', { submissionId, role: role.roleKey, ms: Date.now() - started })
    return json({ ok: true })
  } catch (err) {
    logError('apply_failed', err, { submissionId, ms: Date.now() - started })
    return json({ ok: false, code: 'server', error: SERVER_ERROR }, 500)
  }
}

/** Auto-pause a role once this cycle's applications reach its cap. */
async function enforceCap(payload: Payload, roleId: number, roleKey: string, cap: number, cycle: string) {
  try {
    const { totalDocs } = await payload.count({
      collection: 'applications',
      where: { and: [{ role: { equals: roleKey } }, { cycle: { equals: cycle } }] },
      overrideAccess: true,
    })
    if (totalDocs >= cap) {
      await payload.update({
        collection: 'job-openings',
        id: roleId,
        data: { status: 'paused' },
        overrideAccess: true,
      })
      invalidateRoleCache()
      logWarn('role_auto_paused', { role: roleKey, cap, total: totalDocs })
    }
  } catch (err) {
    logError('cap_check_failed', err, { role: roleKey })
  }
}
