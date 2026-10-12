import { requireAdmin } from '@/lib/careers/admin'
import { careersConfig } from '@/lib/careers/config'
import { pgPool } from '@/lib/careers/db'
import { logError } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'

export const dynamic = 'force-dynamic'

/** Roles with live counts for this cycle: total, today (IST), shortlisted. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload } = auth
  const cycle = new URL(req.url).searchParams.get('cycle') || careersConfig.cycle
  // start of today in IST
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
  const todayStart = `${ist}T00:00:00.000+05:30`
  try {
    const roles = await payload.find({
      collection: 'job-openings',
      where: { slug: { exists: true } },
      sort: 'order',
      limit: 100,
      depth: 0,
    })
    const count = async (where: object) =>
      (await payload.count({ collection: 'applications', where: where as never, overrideAccess: true })).totalDocs
    const rows = await Promise.all(
      roles.docs.map(async (r) => {
        const base = [{ role: { equals: r.roleKey } }, ...(cycle === 'all' ? [] : [{ cycle: { equals: cycle } }])]
        const [total, today, shortlisted] = await Promise.all([
          count({ and: base }),
          count({ and: [...base, { createdAt: { greater_than_equal: todayStart } }] }),
          count({ and: [...base, { stage: { equals: 'shortlisted' } }] }),
        ])
        return {
          id: r.id,
          title: r.title,
          roleKey: r.roleKey,
          slug: r.slug,
          status: r.status ?? 'open',
          applicationCap: r.applicationCap ?? null,
          roleKind: r.roleKind,
          total,
          today,
          shortlisted,
        }
      }),
    )
    const cycles = (
      await pgPool(payload).query<{ cycle: string }>(
        `SELECT DISTINCT cycle FROM applications WHERE cycle IS NOT NULL ORDER BY cycle DESC`,
      )
    ).rows.map((r) => r.cycle)
    return json({ ok: true, cycle, currentCycle: careersConfig.cycle, cycles, roles: rows })
  } catch (err) {
    logError('admin_roles_failed', err)
    return json({ ok: false, error: 'Couldn’t load roles.' }, 500)
  }
}
