import type { Payload } from 'payload'
import { careersConfig } from './config'
import { hashId } from './crypto'
import { pgPool } from './db'
import { logWarn } from './log'

/**
 * Per-IP fixed-window rate limit kept in Postgres — shared across every Cloud
 * Run instance (in-memory limits don't work there), no extra service or bill.
 * One upsert per request on an UNLOGGED table in its own `careers_ops` schema
 * (outside Payload's schema push, so it is never touched by it). Keys are
 * salted hashes, never raw IPs.
 *
 * Fails open: if the limiter itself errors, the request goes through — Turnstile
 * is the primary gate and a limiter hiccup must never lose an application.
 */
let ready: Promise<void> | null = null

function ensureTable(payload: Payload) {
  if (!ready) {
    ready = pgPool(payload)
      .query(
        `CREATE SCHEMA IF NOT EXISTS careers_ops;
         CREATE UNLOGGED TABLE IF NOT EXISTS careers_ops.rate_limits (
           key text PRIMARY KEY,
           count integer NOT NULL,
           window_start timestamptz NOT NULL
         );`,
      )
      .then(() => undefined)
      .catch((err) => {
        ready = null
        throw err
      })
  }
  return ready
}

export async function rateLimit(
  payload: Payload,
  bucket: 'upload' | 'submit',
  ip: string,
  limit: number,
  windowSeconds = 600,
): Promise<{ ok: boolean; retryAfter: number }> {
  if (careersConfig.rateLimitDisabled) return { ok: true, retryAfter: 0 }
  try {
    await ensureTable(payload)
    const key = `${bucket}:${hashId(ip)}`
    const res = await pgPool(payload).query<{ count: number; reset_in: number }>(
      `INSERT INTO careers_ops.rate_limits AS r (key, count, window_start)
       VALUES ($1, 1, now())
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN r.window_start < now() - make_interval(secs => $2) THEN 1 ELSE r.count + 1 END,
         window_start = CASE WHEN r.window_start < now() - make_interval(secs => $2) THEN now() ELSE r.window_start END
       RETURNING count, ceil(extract(epoch FROM (window_start + make_interval(secs => $2) - now())))::int AS reset_in`,
      [key, windowSeconds],
    )
    // occasional sweep of stale windows
    if (Math.random() < 0.01) {
      void pgPool(payload)
        .query(`DELETE FROM careers_ops.rate_limits WHERE window_start < now() - interval '1 day'`)
        .catch(() => {})
    }
    const { count, reset_in } = res.rows[0]
    return { ok: count <= limit, retryAfter: Math.max(1, reset_in) }
  } catch (err) {
    logWarn('rate_limit_unavailable', { error: err instanceof Error ? err.message : 'unknown' })
    return { ok: true, retryAfter: 0 }
  }
}
