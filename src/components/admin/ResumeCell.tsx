'use client'

/**
 * Admin list cell for the résumé upload — one-click "Open PDF" straight from the
 * applications row (v3.5 triage). Prefers the file URL; falls back to the résumé
 * doc when the cell isn't populated. stopPropagation so the link doesn't also
 * trigger the row's navigate-to-edit.
 */
type ResumeData = { id?: string | number; url?: string | null; filename?: string | null }

export default function ResumeCell({
  cellData,
}: {
  cellData?: ResumeData | string | number | null
}) {
  if (!cellData || typeof cellData !== 'object') {
    return <span style={{ opacity: 0.4 }}>—</span>
  }

  const { url, id } = cellData
  const href = url ?? (id != null ? `/admin/collections/resumes/${id}` : null)
  if (!href) return <span style={{ opacity: 0.4 }}>—</span>

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{ fontWeight: 600, whiteSpace: 'nowrap' }}
    >
      Open PDF&nbsp;↗
    </a>
  )
}
