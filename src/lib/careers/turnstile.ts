import { careersConfig } from './config'
import { logWarn } from './log'

/**
 * Cloudflare Turnstile server-side check. In dev with no secret configured the
 * check is skipped; in production a missing secret fails closed (logged).
 */
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = careersConfig.turnstileSecret
  if (!secret) {
    if (!careersConfig.isProd) return true
    logWarn('turnstile_secret_missing')
    return false
  }
  if (!token) return false
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip && ip !== 'unknown') body.set('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    })
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (!data.success) logWarn('turnstile_rejected', { codes: (data['error-codes'] ?? []).join(',') })
    return Boolean(data.success)
  } catch (err) {
    // Cloudflare unreachable: fail closed, the client shows a retry message
    logWarn('turnstile_unreachable', { error: err instanceof Error ? err.name : 'unknown' })
    return false
  }
}
