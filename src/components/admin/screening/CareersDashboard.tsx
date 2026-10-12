import type { ServerProps } from 'payload'
import Link from 'next/link'

/**
 * Dashboard strip: live applications per role for the current cycle, with a
 * way into the screening desk. Counts only — no applicant details here.
 */
export async function CareersDashboard({ payload, user }: ServerProps) {
  if (!user || !payload) return null
  const cycle = process.env.CAREERS_CYCLE || '2026-10'
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
  const todayStart = `${ist}T00:00:00.000+05:30`
  let rows: { title: string; status: string; total: number; today: number; shortlisted: number }[] = []
  try {
    const roles = await payload.find({
      collection: 'job-openings',
      where: { and: [{ slug: { exists: true } }, { status: { not_equals: 'archived' } }] },
      sort: 'order',
      limit: 20,
      depth: 0,
    })
    const count = async (where: object) =>
      (await payload.count({ collection: 'applications', where: where as never, overrideAccess: true })).totalDocs
    rows = await Promise.all(
      roles.docs.map(async (r) => {
        const base = [{ role: { equals: r.roleKey } }, { cycle: { equals: cycle } }]
        const [total, today, shortlisted] = await Promise.all([
          count({ and: base }),
          count({ and: [...base, { createdAt: { greater_than_equal: todayStart } }] }),
          count({ and: [...base, { stage: { equals: 'shortlisted' } }] }),
        ])
        return { title: r.title, status: r.status ?? 'open', total, today, shortlisted }
      }),
    )
  } catch {
    return null
  }

  const cell: React.CSSProperties = { padding: '6px 16px 6px 0', textAlign: 'right' }
  return (
    <div
      style={{
        marginBottom: 'calc(var(--base) * 2)',
        padding: 'var(--base)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 'var(--style-radius-m, 6px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>Careers · cycle {cycle}</h3>
        <Link href="/admin/screening" style={{ fontWeight: 600 }}>
          Open screening →
        </Link>
      </div>
      <table style={{ marginTop: 12, borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>
            <th style={{ textAlign: 'left', paddingRight: 24 }}>Role</th>
            <th style={{ textAlign: 'left', paddingRight: 16 }}>Status</th>
            <th style={cell}>Today</th>
            <th style={cell}>Total</th>
            <th style={cell}>Shortlisted</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.title}>
              <td style={{ padding: '6px 24px 6px 0' }}>{r.title}</td>
              <td style={{ padding: '6px 16px 6px 0' }}>{r.status}</td>
              <td style={cell}>
                <b>{r.today}</b>
              </td>
              <td style={cell}>{r.total}</td>
              <td style={cell}>{r.shortlisted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CareersDashboard
