import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { careersConfig } from './config'

export function hmac(value: string): string {
  return createHmac('sha256', careersConfig.secret).update(value).digest('base64url')
}

export function verifyHmac(value: string, sig: string): boolean {
  const expected = Buffer.from(hmac(value))
  const given = Buffer.from(sig || '')
  return expected.length === given.length && timingSafeEqual(expected, given)
}

/** Salted, one-way — for audit entries and rate-limit keys (no raw PII stored). */
export function hashId(value: string): string {
  return createHash('sha256').update(`${careersConfig.secret}:${value}`).digest('hex').slice(0, 32)
}

/**
 * Upload ticket — issued by upload-url only after Turnstile + rate limit pass,
 * required by submit. Binds the pending object key to an expiry, so submit can
 * trust that this exact upload slot went through the human check (Turnstile
 * tokens are single-use, so the same token can't be verified twice).
 */
const TICKET_TTL_MS = 2 * 60 * 60 * 1000

export function issueUploadTicket(objectKey: string, now = Date.now()): string {
  const exp = now + TICKET_TTL_MS
  return `${exp}.${hmac(`ticket:${objectKey}:${exp}`)}`
}

export function verifyUploadTicket(objectKey: string, ticket: string, now = Date.now()): boolean {
  const [expStr, sig] = String(ticket || '').split('.')
  const exp = Number(expStr)
  if (!exp || exp < now || !sig) return false
  return verifyHmac(`ticket:${objectKey}:${exp}`, sig)
}
