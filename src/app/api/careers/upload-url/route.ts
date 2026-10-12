import { randomUUID } from 'node:crypto'
import { careersConfig } from '@/lib/careers/config'
import { issueUploadTicket } from '@/lib/careers/crypto'
import { payloadInstance } from '@/lib/careers/db'
import { logError } from '@/lib/careers/log'
import { rateLimit } from '@/lib/careers/rateLimit'
import { clientIp, json } from '@/lib/careers/request'
import { findOpenRole } from '@/lib/careers/roles'
import { getStorage, pendingKey } from '@/lib/careers/storage'
import { verifyTurnstile } from '@/lib/careers/turnstile'
import { RESUME_CONTENT_TYPE, RESUME_MAX_BYTES } from '@/lib/careers/validation'

export const dynamic = 'force-dynamic'

/**
 * Step 1 of an application: hand the browser a short-lived signed POST so it
 * can upload the CV straight to the private bucket (never through this
 * server). Gated by rate limit → role open → file shape → Turnstile. Returns an
 * upload ticket the submit endpoint requires.
 */
export async function POST(req: Request) {
  const started = Date.now()
  try {
    const body = (await req.json().catch(() => null)) as {
      role?: string
      fileSize?: number
      contentType?: string
      turnstileToken?: string
    } | null
    if (!body) return json({ ok: false, code: 'bad_request', error: 'Something was off with that request. Please try again.' }, 400)

    const payload = await payloadInstance()
    const ip = clientIp(req)

    const limited = await rateLimit(payload, 'upload', ip, careersConfig.rateLimitUploadUrl)
    if (!limited.ok) {
      return json(
        { ok: false, code: 'rate_limited', error: 'Too many attempts from this network. Please wait a few minutes and try again.' },
        429,
        { 'retry-after': String(limited.retryAfter) },
      )
    }

    if (body.contentType !== RESUME_CONTENT_TYPE) {
      return json({ ok: false, code: 'not_pdf', error: 'Your CV needs to be a PDF file.' }, 400)
    }
    const size = Number(body.fileSize)
    if (!Number.isFinite(size) || size <= 0) {
      return json({ ok: false, code: 'empty_file', error: 'That file is empty — pick your CV again.' }, 400)
    }
    if (size > RESUME_MAX_BYTES) {
      return json({ ok: false, code: 'too_large', error: 'That PDF is over 5 MB — mind compressing it?' }, 400)
    }

    const { error: roleError } = await findOpenRole(payload, String(body.role || ''))
    if (roleError) {
      return json({ ok: false, code: roleError, error: 'Applications for this role aren’t open right now.' }, 409)
    }

    if (!(await verifyTurnstile(String(body.turnstileToken || ''), ip))) {
      return json({ ok: false, code: 'turnstile', error: 'We couldn’t verify you’re human. Please try again.' }, 403)
    }

    const objectKey = pendingKey(randomUUID())
    const upload = await getStorage().createUploadSlot(objectKey, {
      maxBytes: RESUME_MAX_BYTES,
      contentType: RESUME_CONTENT_TYPE,
      expiresInSeconds: 600,
    })

    return json({ ok: true, objectKey, upload, ticket: issueUploadTicket(objectKey) })
  } catch (err) {
    logError('upload_url_failed', err, { ms: Date.now() - started })
    return json(
      { ok: false, code: 'server', error: 'Something went wrong on our side — nothing you did. Please try again.' },
      500,
    )
  }
}
