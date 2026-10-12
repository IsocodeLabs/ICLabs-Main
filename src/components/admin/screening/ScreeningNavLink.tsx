import Link from 'next/link'

/** "Screening" entry at the top of the admin nav. */
export function ScreeningNavLink() {
  return (
    <div style={{ marginBottom: 'calc(var(--base) * 0.75)' }}>
      <Link
        href="/admin/screening"
        style={{
          display: 'block',
          fontWeight: 600,
          padding: '8px 12px',
          borderRadius: 'var(--style-radius-s, 4px)',
          background: 'var(--theme-elevation-100)',
          color: 'var(--theme-text)',
          textDecoration: 'none',
        }}
      >
        Careers screening →
      </Link>
    </div>
  )
}

export default ScreeningNavLink
