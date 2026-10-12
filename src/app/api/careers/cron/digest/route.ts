import { careersConfig } from '@/lib/careers/config'
import { verifyHmac, hmac } from '@/lib/careers/crypto'
import { payloadInstance } from '@/lib/careers/db'
import { logError, logInfo } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'
import { careersDigestHtml, notifyFounders } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/**
 * Founders' daily digest — one email a day with counts per role, instead of an
 * email per application (1,000 emails in an hour helps nobody). Triggered by
 * Cloud Scheduler: POST with `Authorization: Bearer $CAREERS_CRON_SECRET`.
 */
export async function POST(req: Request) {
  const secret = careersConfig.cronSecret
  const given = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!secret || !verifyHmac(given, hmac(secret))) return json({ ok: false }, 401)

  try {
    const payload = await payloadInstance()
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const cycle = careersConfig.cycle
    const roles = await payload.find({
      collection: 'job-openings',
      where: { status: { in: ['open', 'paused', 'closed'] } },
      sort: 'order',
      limit: 50,
      depth: 0,
    })
    const count = async (where: Record<string, unknown>) =>
      (await payload.count({ collection: 'applications', where: where as never, overrideAccess: true })).totalDocs
    const rows = await Promise.all(
      roles.docs.map(async (r) => {
        const base = [{ role: { equals: r.roleKey } }, { cycle: { equals: cycle } }]
        return {
          title: r.title,
          status: r.status ?? 'open',
          last24h: await count({ and: [...base, { createdAt: { greater_than_equal: since } }] }),
          total: await count({ and: base }),
          shortlisted: await count({ and: [...base, { stage: { equals: 'shortlisted' } }] }),
        }
      }),
    )
    const total24 = rows.reduce((s, r) => s + r.last24h, 0)
    await notifyFounders(
      `Careers digest — ${total24} new application${total24 === 1 ? '' : 's'}`,
      careersDigestHtml({ since, rows, adminUrl: careersConfig.adminUrl }),
    )
    logInfo('digest_sent', { total24 })
    return json({ ok: true, total24 })
  } catch (err) {
    logError('digest_failed', err)
    return json({ ok: false }, 500)
  }
}
