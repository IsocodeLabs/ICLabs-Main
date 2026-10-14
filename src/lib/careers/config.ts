/**
 * Careers server config, read once from the environment. See .env.example and
 * docs/careers-runbook.md for what each value is and where it comes from.
 */
const isProd = process.env.NODE_ENV === 'production'

export const careersConfig = {
  isProd,
  /** hiring cycle new applications are filed under; one application per email + role + cycle */
  cycle: process.env.CAREERS_CYCLE || '2026-10',
  /** 'gcs' (production) or 'local' (dev only — files under .local/storage) */
  storageDriver: (process.env.CAREERS_STORAGE || (isProd ? 'gcs' : 'local')) as 'gcs' | 'local',
  bucket: process.env.CAREERS_GCS_BUCKET || '',
  /** HMAC key for upload tickets / dev signed URLs. Falls back to PAYLOAD_SECRET. */
  secret: process.env.CAREERS_SIGNING_SECRET || process.env.PAYLOAD_SECRET || 'dev-secret',
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY || '',
  /**
   * Cloudflare Turnstile ("Verify you are human") before a CV upload. OFF unless
   * CAREERS_HUMAN_CHECK=on — it was stopping real applicants. Rate limits, the
   * PDF checks, the honeypot and one-application-per-email still apply. If spam
   * shows up, set CAREERS_HUMAN_CHECK=on on Cloud Run (no code change; pages
   * pick it up within ~60 s).
   */
  humanCheck: process.env.CAREERS_HUMAN_CHECK === 'on',
  /** per-IP limits per 10 minutes — generous because campus hostels share IPs; Turnstile is the main gate */
  rateLimitUploadUrl: Number(process.env.CAREERS_RL_UPLOAD) || 40,
  rateLimitSubmit: Number(process.env.CAREERS_RL_SUBMIT) || 20,
  rateLimitDisabled: process.env.CAREERS_RL_DISABLED === 'true',
  cronSecret: process.env.CAREERS_CRON_SECRET || '',
  adminUrl: `${process.env.NEXT_PUBLIC_SERVER_URL || 'https://isocodelabs.com'}/admin/screening`,
}

/** Throwing here surfaces misconfiguration in logs + Error Reporting rather than silently accepting. */
export function assertStorageConfigured() {
  if (careersConfig.storageDriver === 'gcs' && !careersConfig.bucket) {
    throw new Error('CAREERS_GCS_BUCKET is not set')
  }
  if (careersConfig.storageDriver === 'local' && isProd) {
    throw new Error('CAREERS_STORAGE=local is not allowed in production')
  }
}
