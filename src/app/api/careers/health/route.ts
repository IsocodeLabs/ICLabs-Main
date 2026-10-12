import { careersConfig } from '@/lib/careers/config'
import { payloadInstance, pgPool } from '@/lib/careers/db'
import { logError } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'

export const dynamic = 'force-dynamic'

/** Uptime-check target for the application pipeline: DB reachable + config present. No secrets. */
export async function GET() {
  const checks = {
    db: false,
    storage: careersConfig.storageDriver === 'local' ? !careersConfig.isProd : Boolean(careersConfig.bucket),
    turnstile: Boolean(careersConfig.turnstileSecret) || !careersConfig.isProd,
  }
  try {
    const payload = await payloadInstance()
    await pgPool(payload).query('SELECT 1')
    checks.db = true
  } catch (err) {
    logError('health_db_failed', err)
  }
  const ok = Object.values(checks).every(Boolean)
  return json({ ok, checks, cycle: careersConfig.cycle }, ok ? 200 : 503)
}
