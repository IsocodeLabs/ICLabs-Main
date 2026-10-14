'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Filters, Row } from '@/lib/careers/admin'
import { TaskEmailDialog } from './TaskEmailDialog'
import { reviewLabel } from '@/lib/careers/review'
import { ReviewPanel, type Viewer } from './ReviewPanel'
import styles from './Screening.module.css'

/**
 * The screening desk. Left: a dense, sheet-like table of the current filter
 * (50 a page, server-side). Right: the focused applicant — details, rating,
 * stage, tags, notes — beside their CV, inline. Built for keyboard:
 *
 *   j / ↓  next     k / ↑  previous     1–5  rate     0  clear rating
 *   s  shortlist    r  reject           p  in process  x  select row
 *   v  read CV full screen (Esc closes) o  open CV in a new tab
 *   /  search                           ?  shortcuts
 */

/** PDF viewer hint: fit the page to the frame's width so a CV is readable in place. */
const fitWidth = (url: string) => `${url}#view=FitH&navpanes=0`
const STAGES = [
  ['applied', 'Applied'],
  ['shortlisted', 'Shortlisted'],
  ['in_process', 'In process'],
  ['offer', 'Offer'],
  ['hired', 'Hired'],
  ['rejected', 'Rejected'],
  ['withdrawn', 'Withdrawn'],
] as const
const STAGE_LABEL = Object.fromEntries(STAGES) as Record<string, string>

const REVIEW_FILTERS = [
  ['', 'Any review'],
  ['mine', 'Not reviewed by me'],
  ['awaiting', 'Not reviewed yet'],
  ['waiting', 'Waiting for 2nd review'],
  ['discussion', 'Discussion'],
  ['agreed', 'Agreed'],
  ['undecided', 'Undecided'],
] as const

type RoleRow = {
  id: number
  title: string
  roleKey: string
  slug: string
  status: string
  applicationCap: number | null
  roleKind: string
  total: number
  today: number
  shortlisted: number
}

const HEADERS = { 'content-type': 'application/json', 'x-careers-admin': '1' }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin', ...init, headers: { ...HEADERS, ...(init?.headers ?? {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) throw new Error(data.error || `Request failed (${res.status})`)
  return data as T
}

function qs(f: Filters, extra: Record<string, string | number> = {}) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, String(v))
  for (const [k, v] of Object.entries(extra)) p.set(k, String(v))
  return p.toString()
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

export function ScreeningApp({ initialFilters = {} }: { initialFilters?: Filters }) {
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [focus, setFocus] = useState(0)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [cycles, setCycles] = useState<string[]>([])
  const [currentCycle, setCurrentCycle] = useState('')
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [cvUrl, setCvUrl] = useState<string | null>(null)
  const [cvError, setCvError] = useState<string | null>(null)
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [cvBig, setCvBig] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [emailing, setEmailing] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const cvCache = useRef(new Map<number, { url: string; at: number }>())
  const pendingFocusLast = useRef(false)
  const toastTimer = useRef<number | undefined>(undefined)
  // Payload writes whole documents, so two in-flight edits to the same row (rate
  // then shortlist in quick succession) would clobber each other. Edits queue.
  const editQueue = useRef<Promise<unknown>>(Promise.resolve())

  const current = rows[focus] ?? null
  const roleTitle = useMemo(() => Object.fromEntries(roles.map((r) => [r.roleKey, r.title])), [roles])

  const say = useCallback((text: string, error = false) => {
    setToast({ text, error })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), error ? 6000 : 2500)
  }, [])

  // ── data ──
  const loadRoles = useCallback(async () => {
    try {
      const data = await api<{ roles: RoleRow[]; cycles: string[]; currentCycle: string }>(
        `/api/careers/admin/roles?${qs({ cycle: filters.cycle })}`,
      )
      setRoles(data.roles)
      setCycles(data.cycles)
      setCurrentCycle(data.currentCycle)
    } catch (e) {
      say((e as Error).message, true)
    }
  }, [filters.cycle, say])

  const loadRows = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ docs: Row[]; totalDocs: number; totalPages: number; viewer: Viewer | null }>(
        `/api/careers/admin/applications?${qs(filters, { page })}`,
      )
      setRows(data.docs)
      setViewer(data.viewer ?? null)
      setTotal(data.totalDocs)
      setTotalPages(Math.max(1, data.totalPages))
      setFocus(pendingFocusLast.current ? Math.max(0, data.docs.length - 1) : 0)
      pendingFocusLast.current = false
    } catch (e) {
      say((e as Error).message, true)
    } finally {
      setLoading(false)
    }
  }, [filters, page, say])

  useEffect(() => {
    void loadRoles()
  }, [loadRoles])

  useEffect(() => {
    void loadRows()
    try {
      const q = qs(filters, page > 1 ? { page } : {})
      window.history.replaceState(null, '', `${window.location.pathname}${q ? `?${q}` : ''}`)
    } catch {
      // ignore
    }
  }, [loadRows, filters, page])

  const setFilter = (k: keyof Filters, v: string) => {
    setPage(1)
    setChecked(new Set())
    setFilters((f) => {
      const next = { ...f, [k]: v || undefined }
      if (k === 'unrated' && v) delete next.ratingMin
      if (k === 'ratingMin' && v) delete next.unrated
      return next
    })
  }

  // ── CV for the focused row ──
  useEffect(() => {
    setCvError(null)
    if (!current) return setCvUrl(null)
    if (!current.hasCv) {
      setCvUrl(null)
      setCvError('No CV on file.')
      return
    }
    const cached = cvCache.current.get(current.id)
    if (cached && Date.now() - cached.at < 8 * 60 * 1000) return setCvUrl(cached.url)
    let cancelled = false
    setCvUrl(null)
    api<{ url: string }>(`/api/careers/admin/cv/${current.id}`)
      .then((d) => {
        cvCache.current.set(current.id, { url: d.url, at: Date.now() })
        if (!cancelled) setCvUrl(d.url)
      })
      .catch((e) => !cancelled && setCvError((e as Error).message))
    return () => {
      cancelled = true
    }
  }, [current?.id, current?.hasCv])

  // ── edits (optimistic) ──
  const patch = useCallback(
    async (row: Row, data: Partial<Pick<Row, 'rating' | 'stage' | 'tags' | 'notes'>>) => {
      const before = rows
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...data } : r)))
      try {
        const job = editQueue.current.then(() =>
          api<{ row: Row }>(`/api/careers/admin/applications/${row.id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
          }),
        )
        editQueue.current = job.catch(() => {})
        const res = await job
        setRows((rs) => rs.map((r) => (r.id === row.id ? res.row : r)))
        if (data.stage) void loadRoles()
      } catch (e) {
        setRows(before)
        say((e as Error).message, true)
      }
    },
    [rows, loadRoles, say],
  )

  // a founder's own review of an applicant. Queued with other edits so they don't race.
  const saveReview = useCallback(
    async (row: Row, data: { decision: string; rating: number | null; note: string }) => {
      const job = editQueue.current.then(() =>
        api<{ row: Row }>(`/api/careers/admin/applications/${row.id}/review`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      )
      editQueue.current = job.catch(() => {})
      try {
        const res = await job
        setRows((rs) => rs.map((r) => (r.id === row.id ? res.row : r)))
        say('Review saved')
      } catch (e) {
        say((e as Error).message, true)
      }
    },
    [say],
  )

  const move = useCallback(
    (delta: number) => {
      setFocus((i) => {
        const next = i + delta
        if (next >= rows.length) {
          if (page < totalPages) setPage((p) => p + 1)
          return i
        }
        if (next < 0) {
          if (page > 1) {
            pendingFocusLast.current = true
            setPage((p) => p - 1)
          }
          return i
        }
        return next
      })
    },
    [rows.length, page, totalPages],
  )

  const setStage = useCallback(
    (row: Row, stage: string) => {
      void patch(row, { stage })
      say(`${row.name || 'Applicant'} → ${STAGE_LABEL[stage]}`)
      if (autoAdvance) move(1)
    },
    [patch, say, autoAdvance, move],
  )

  // ── keyboard ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (deleting || emailing) return
      if (cvBig && e.key === 'Escape') return setCvBig(false)
      if (isTyping(e.target)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur()
        return
      }
      const row = rows[focus]
      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault()
          move(1)
          break
        case 'k':
        case 'ArrowUp':
          e.preventDefault()
          move(-1)
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          if (row) void patch(row, { rating: Number(e.key) })
          break
        case '0':
          if (row) void patch(row, { rating: null })
          break
        case 's':
          if (row) setStage(row, 'shortlisted')
          break
        case 'r':
          if (row) setStage(row, 'rejected')
          break
        case 'p':
          if (row) setStage(row, 'in_process')
          break
        case 'x':
          if (row)
            setChecked((c) => {
              const n = new Set(c)
              if (n.has(row.id)) n.delete(row.id)
              else n.add(row.id)
              return n
            })
          break
        case 'o':
          if (cvUrl) window.open(cvUrl, '_blank', 'noopener')
          break
        case 'v':
          if (row) setCvBig((v) => !v)
          break
        case '/':
          e.preventDefault()
          searchRef.current?.focus()
          break
        case '?':
          setShowHelp((v) => !v)
          break
        default:
          return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rows, focus, move, patch, setStage, cvUrl, deleting, emailing, cvBig])

  // keep the focused row in view
  useEffect(() => {
    document.querySelector(`[data-row-index="${focus}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [focus, rows])

  // ── bulk + exports ──
  async function bulkStage(stage: string, all: boolean) {
    const n = all ? total : checked.size
    if (!stage || n === 0) return
    if (!window.confirm(`Move ${n} applicant${n === 1 ? '' : 's'} to “${STAGE_LABEL[stage]}”?`)) return
    setBusy('bulk')
    try {
      const res = await api<{ updated: number; failed: number }>('/api/careers/admin/applications', {
        method: 'POST',
        body: JSON.stringify(all ? { all: true, filters, stage } : { ids: [...checked], stage }),
      })
      say(`Moved ${res.updated} to ${STAGE_LABEL[stage]}${res.failed ? ` (${res.failed} failed)` : ''}`)
      setChecked(new Set())
      await Promise.all([loadRows(), loadRoles()])
    } catch (e) {
      say((e as Error).message, true)
    } finally {
      setBusy(null)
    }
  }

  async function downloadZip(onlySelected: boolean) {
    setBusy('zip')
    say('Building ZIP… this can take a minute for a few hundred CVs.')
    try {
      const res = await api<{ url: string; count: number }>('/api/careers/admin/zip', {
        method: 'POST',
        body: JSON.stringify(onlySelected ? { ids: [...checked] } : { filters }),
      })
      say(`ZIP ready: ${res.count} CVs. Link valid for 1 hour.`)
      window.location.href = res.url
    } catch (e) {
      say((e as Error).message, true)
    } finally {
      setBusy(null)
    }
  }

  async function updateRole(role: RoleRow, data: { status?: string; applicationCap?: number | null }) {
    try {
      await api(`/api/careers/admin/roles/${role.id}`, { method: 'PATCH', body: JSON.stringify(data) })
      say(`${role.title}: ${data.status ? `now ${data.status}` : 'cap saved'} — live site updates within 60 s`)
      void loadRoles()
    } catch (e) {
      say((e as Error).message, true)
    }
  }

  const allChecked = rows.length > 0 && rows.every((r) => checked.has(r.id))
  const filterActive = Object.entries(filters).some(([k, v]) => v && k !== 'cycle')

  return (
    <div className={styles.app}>
      {/* ── header: roles + counts + controls ── */}
      <div className={styles.head}>
        <div className={styles.titleRow}>
          <h1 className={styles.h1}>Screening</h1>
          <label className={styles.inline}>
            Cycle
            <select value={filters.cycle ?? currentCycle} onChange={(e) => setFilter('cycle', e.target.value)}>
              {[...new Set([currentCycle, filters.cycle, ...cycles])].filter((c): c is string => Boolean(c) && c !== 'all').map((c) => (
                <option key={c} value={c}>
                  {c}
                  {c === currentCycle ? ' (current)' : ''}
                </option>
              ))}
              <option value="all">All cycles</option>
            </select>
          </label>
          <button type="button" className={styles.linkBtn} onClick={() => setShowHelp((v) => !v)}>
            Keyboard shortcuts (?)
          </button>
        </div>

        <div className={styles.roles}>
          <button
            type="button"
            className={`${styles.roleCard} ${!filters.role ? styles.roleActive : ''}`}
            onClick={() => setFilter('role', '')}
          >
            <span className={styles.roleTitle}>All roles</span>
            <span className={styles.roleNums}>
              {roles.reduce((s, r) => s + r.total, 0)} total · {roles.reduce((s, r) => s + r.today, 0)} today
            </span>
          </button>
          {roles
            .filter((r) => r.status !== 'archived' || r.total > 0)
            .map((r) => (
              <div key={r.id} className={`${styles.roleCard} ${filters.role === r.roleKey ? styles.roleActive : ''}`}>
                <button type="button" className={styles.roleBody} onClick={() => setFilter('role', r.roleKey)}>
                  <span className={styles.roleTitle}>{r.title}</span>
                  <span className={styles.roleNums}>
                    <b>{r.total}</b> total · <b>{r.today}</b> today · <b>{r.shortlisted}</b> shortlisted
                  </span>
                </button>
                {r.status !== 'archived' && (
                  <div className={styles.roleControls}>
                    <select
                      aria-label={`${r.title} status`}
                      value={r.status}
                      data-status={r.status}
                      className={styles.statusSelect}
                      onChange={(e) => {
                        if (window.confirm(`Set “${r.title}” to ${e.target.value}?`)) void updateRole(r, { status: e.target.value })
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="paused">Paused</option>
                      <option value="closed">Closed</option>
                    </select>
                    <input
                      aria-label={`${r.title} application cap`}
                      className={styles.capInput}
                      type="number"
                      min={1}
                      placeholder="No cap"
                      defaultValue={r.applicationCap ?? ''}
                      key={`${r.id}-${r.applicationCap}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim()
                        const next = v ? Number(v) : null
                        if (next !== r.applicationCap) void updateRole(r, { applicationCap: next })
                      }}
                      title="Auto-pause after this many applications this cycle"
                    />
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* ── filters ── */}
        <div className={styles.filters}>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search name, email, college  ( / )"
            defaultValue={filters.q ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setFilter('q', (e.target as HTMLInputElement).value)
            }}
            onBlur={(e) => e.target.value !== (filters.q ?? '') && setFilter('q', e.target.value)}
            className={styles.search}
          />
          <select value={filters.stage ?? ''} onChange={(e) => setFilter('stage', e.target.value)} aria-label="Stage">
            <option value="">Any stage</option>
            {STAGES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select value={filters.review ?? ''} onChange={(e) => setFilter('review', e.target.value)} aria-label="Review">
            {REVIEW_FILTERS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            aria-label="Rating"
            value={filters.unrated ? 'unrated' : filters.ratingMin ?? ''}
            onChange={(e) =>
              e.target.value === 'unrated' ? setFilter('unrated', '1') : (setFilter('unrated', ''), setFilter('ratingMin', e.target.value))
            }
          >
            <option value="">Any rating</option>
            <option value="unrated">Unrated</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)}
                {n < 5 ? '+' : ''}
              </option>
            ))}
          </select>
          <input
            aria-label="Graduation year"
            placeholder="Grad year"
            inputMode="numeric"
            className={styles.small}
            defaultValue={filters.gradYear ?? ''}
            onBlur={(e) => e.target.value !== (filters.gradYear ?? '') && setFilter('gradYear', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setFilter('gradYear', (e.target as HTMLInputElement).value)}
          />
          <input
            aria-label="College"
            placeholder="College"
            defaultValue={filters.college ?? ''}
            onBlur={(e) => e.target.value !== (filters.college ?? '') && setFilter('college', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setFilter('college', (e.target as HTMLInputElement).value)}
          />
          <input
            aria-label="Tag"
            placeholder="Tag"
            className={styles.small}
            defaultValue={filters.tag ?? ''}
            onBlur={(e) => e.target.value !== (filters.tag ?? '') && setFilter('tag', e.target.value.toLowerCase())}
            onKeyDown={(e) => e.key === 'Enter' && setFilter('tag', (e.target as HTMLInputElement).value.toLowerCase())}
          />
          <label className={styles.inline}>
            From
            <input type="date" value={filters.from ?? ''} onChange={(e) => setFilter('from', e.target.value)} />
          </label>
          <label className={styles.inline}>
            To
            <input type="date" value={filters.to ?? ''} onChange={(e) => setFilter('to', e.target.value)} />
          </label>
          <select value={filters.sort ?? ''} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
            <option value="">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="rating">Top rated (rated only)</option>
          </select>
          {filterActive && (
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                setPage(1)
                setFilters({ cycle: filters.cycle })
                if (searchRef.current) searchRef.current.value = ''
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── bulk + export bar ── */}
        <div className={styles.bulk}>
          <span className={styles.count}>
            {loading ? 'Loading…' : `${total.toLocaleString('en-IN')} applicant${total === 1 ? '' : 's'}`}
            {checked.size > 0 && ` · ${checked.size} selected`}
          </span>
          <select
            aria-label="Bulk stage change"
            value=""
            disabled={busy !== null || (checked.size === 0 && total === 0)}
            onChange={(e) => {
              const [scope, stage] = e.target.value.split(':')
              void bulkStage(stage, scope === 'all')
            }}
          >
            <option value="">Move to stage…</option>
            {checked.size > 0 && (
              <optgroup label={`Selected (${checked.size})`}>
                {STAGES.map(([v, l]) => (
                  <option key={v} value={`sel:${v}`}>
                    {l}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label={`All matching this filter (${total})`}>
              {STAGES.map(([v, l]) => (
                <option key={v} value={`all:${v}`}>
                  {l}
                </option>
              ))}
            </optgroup>
          </select>
          <a className={styles.btn} href={`/api/careers/admin/export?${qs(filters)}`}>
            Export CSV
          </a>
          <button type="button" className={styles.btn} disabled={busy !== null} onClick={() => void downloadZip(checked.size > 0)}>
            {busy === 'zip' ? 'Building ZIP…' : checked.size > 0 ? `Download ${checked.size} CVs (ZIP)` : 'Download CVs (ZIP, ≤ 500)'}
          </button>
          <button
            type="button"
            className={styles.btn}
            disabled={busy !== null || (checked.size === 0 && !filters.role)}
            title={checked.size === 0 && !filters.role ? 'Select people, or filter to one role first' : 'Email the task to the selected people'}
            onClick={() => setEmailing(true)}
          >
            {checked.size > 0 ? `Email task to ${checked.size}…` : 'Email task…'}
          </button>
          <label className={styles.inline} title="After s / r / p, jump to the next applicant">
            <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />
            Auto-advance
          </label>
        </div>
      </div>

      {showHelp && (
        <div className={styles.help} role="dialog" aria-label="Keyboard shortcuts">
          <b>Keyboard</b> — j/↓ next · k/↑ previous · 1–5 rate · 0 clear rating · s shortlist · r reject · p in process ·
          x select · v read CV full screen · o open CV in new tab · / search · ? toggle this
        </div>
      )}

      {/* ── workspace ── */}
      <div className={styles.work}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.cbCol}>
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allChecked}
                    onChange={(e) =>
                      setChecked((c) => {
                        const n = new Set(c)
                        rows.forEach((r) => (e.target.checked ? n.add(r.id) : n.delete(r.id)))
                        return n
                      })
                    }
                  />
                </th>
                <th>Name</th>
                <th>Role</th>
                <th>College</th>
                <th>Grad</th>
                <th>Links</th>
                <th>Rating</th>
                <th>Stage</th>
                <th>Review</th>
                <th>Applied</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  data-row-index={i}
                  className={`${i === focus ? styles.focused : ''} ${checked.has(r.id) ? styles.checked : ''}`}
                  onClick={() => setFocus(i)}
                  aria-selected={i === focus}
                >
                  <td className={styles.cbCol} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.name}`}
                      checked={checked.has(r.id)}
                      onChange={(e) =>
                        setChecked((c) => {
                          const n = new Set(c)
                          if (e.target.checked) n.add(r.id)
                          else n.delete(r.id)
                          return n
                        })
                      }
                    />
                  </td>
                  <td className={styles.nameCell}>{r.name}</td>
                  <td>{roleTitle[r.role] ?? r.roleTitle ?? r.role}</td>
                  <td className={styles.clip}>{r.college}</td>
                  <td>{r.gradYear ?? '—'}</td>
                  <td className={styles.links} onClick={(e) => e.stopPropagation()}>
                    {r.linkedinUrl && (
                      <a href={r.linkedinUrl} target="_blank" rel="noreferrer noopener" title="LinkedIn">
                        in
                      </a>
                    )}
                    {r.githubUrl && (
                      <a href={r.githubUrl} target="_blank" rel="noreferrer noopener" title="GitHub">
                        gh
                      </a>
                    )}
                    {(r.portfolioUrl || r.projectUrl) && (
                      <a href={r.portfolioUrl || r.projectUrl} target="_blank" rel="noreferrer noopener" title="Portfolio / project">
                        ↗
                      </a>
                    )}
                  </td>
                  <td className={styles.stars}>{r.rating ? '★'.repeat(r.rating) : '·'}</td>
                  <td>
                    <span className={styles.stage} data-stage={r.stage}>
                      {STAGE_LABEL[r.stage] ?? r.stage}
                    </span>
                  </td>
                  <td>
                    <span className={styles.review} data-state={r.reviewState}>
                      {reviewLabel(r.reviewState, r.reviewDecision)}
                    </span>
                  </td>
                  <td className={styles.muted}>{fmtDate(r.createdAt)}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className={styles.empty}>
                    No applicants match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className={styles.pager}>
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        </div>

        <div className={styles.side}>
          {current ? (
            <Detail
              key={current.id}
              row={current}
              roleTitle={roleTitle[current.role] ?? current.roleTitle}
              cvUrl={cvUrl}
              cvError={cvError}
              onPatch={(d) => void patch(current, d)}
              onStage={(s) => setStage(current, s)}
              viewer={viewer}
              onReview={(d) => saveReview(current, d)}
              onDelete={() => setDeleting(current)}
              onExpand={() => setCvBig(true)}
            />
          ) : (
            <div className={styles.emptySide}>{loading ? 'Loading…' : 'Pick an applicant.'}</div>
          )}
        </div>
      </div>

      {cvBig && current && (
        <div className={styles.cvReader} role="dialog" aria-label={`CV of ${current.name}`}>
          <div className={styles.cvReaderBar}>
            <b>{current.name || '—'}</b>
            <span className={styles.muted}>
              {roleTitle[current.role] ?? current.roleTitle} · {current.rating ? '★'.repeat(current.rating) : 'unrated'} ·{' '}
              {STAGE_LABEL[current.stage] ?? current.stage}
            </span>
            <span className={styles.cvReaderKeys}>j / k next · previous · 1–5 rate · s shortlist · r reject</span>
            <button type="button" onClick={() => setCvBig(false)}>
              Close (Esc)
            </button>
          </div>
          {cvUrl ? (
            <iframe key={cvUrl} src={fitWidth(cvUrl)} title={`CV of ${current.name}`} className={styles.cvReaderFrame} />
          ) : (
            <div className={styles.cvEmpty}>{cvError ?? 'Loading CV…'}</div>
          )}
        </div>
      )}

      {deleting && (
        <DeleteDialog
          row={deleting}
          onClose={() => setDeleting(null)}
          onDone={() => {
            setDeleting(null)
            say('Applicant data deleted and audit-logged.')
            void loadRows()
            void loadRoles()
          }}
        />
      )}

      {emailing && (
        <TaskEmailDialog
          scope={checked.size > 0 ? { ids: [...checked] } : { all: true, filters }}
          count={checked.size > 0 ? checked.size : total}
          roleLabel={
            checked.size > 0
              ? `${checked.size} selected`
              : roleTitle[filters.role ?? ''] ?? filters.role ?? 'this role'
          }
          onClose={() => setEmailing(false)}
          onDone={(r) => {
            setEmailing(false)
            say(`Task emailed to ${r.sent}${r.failed ? ` (${r.failed} failed)` : ''}`, r.failed > 0)
            setChecked(new Set())
            void loadRows()
          }}
        />
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  )
}

function Detail({
  row,
  roleTitle,
  cvUrl,
  cvError,
  onPatch,
  onStage,
  onDelete,
  viewer,
  onReview,
  onExpand,
}: {
  row: Row
  roleTitle: string
  cvUrl: string | null
  cvError: string | null
  onPatch: (d: Partial<Pick<Row, 'rating' | 'stage' | 'tags' | 'notes'>>) => void
  onStage: (s: string) => void
  onDelete: () => void
  viewer: Viewer | null
  onReview: (d: { decision: string; rating: number | null; note: string }) => Promise<void>
  onExpand: () => void
}) {
  const [tagDraft, setTagDraft] = useState('')
  const wa = row.phone ? `https://wa.me/${row.phone.replace(/[^\d]/g, '').replace(/^(\d{10})$/, '91$1')}` : null

  const links: [string, string][] = [
    ['LinkedIn', row.linkedinUrl],
    ['GitHub', row.githubUrl],
    ['Portfolio', row.portfolioUrl],
    ['Project', row.projectUrl],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <div className={styles.detail}>
      <div className={styles.detailInfo}>
        <div className={styles.detailHead}>
          <h2 className={styles.h2}>{row.name || '—'}</h2>
          <span className={styles.muted}>
            {roleTitle} · {row.cycle}
          </span>
        </div>
        <dl className={styles.dl}>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${row.email}`}>{row.email}</a>
          </dd>
          <dt>Phone</dt>
          <dd>
            {row.phone || '—'}
            {wa && (
              <>
                {' '}
                <a href={wa} target="_blank" rel="noreferrer noopener">
                  WhatsApp ↗
                </a>
              </>
            )}
          </dd>
          <dt>College</dt>
          <dd>
            {row.college || '—'}
            {row.gradYear ? ` · ${row.gradYear}` : ''}
          </dd>
          <dt>Start</dt>
          <dd>
            {row.startDate ? new Date(row.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            {row.commitSixMonths ? ' · 6 months ✓' : ''}
          </dd>
          {links.map(([k, v]) => (
            <FragmentRow key={k} label={k}>
              <a href={v} target="_blank" rel="noreferrer noopener" className={styles.clipLink}>
                {v.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </FragmentRow>
          ))}
          {row.interestArea && <FragmentRow label="Area">{row.interestArea}</FragmentRow>}
          <dt>Applied</dt>
          <dd>{fmtDate(row.createdAt)}</dd>
        </dl>
        {row.why && <Quote label="What they’d do at Isocode" text={row.why} />}
        {row.pitchNote && <Quote label="Sold, pitched or launched" text={row.pitchNote} />}

        <div className={styles.controls}>
          <ReviewPanel row={row} viewer={viewer} onSave={onReview} />
          <div className={styles.ratingRow} role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={row.rating === n}
                className={`${styles.star} ${row.rating && n <= row.rating ? styles.starOn : ''}`}
                onClick={() => onPatch({ rating: row.rating === n ? null : n })}
                title={`Rate ${n} (key ${n})`}
              >
                ★
              </button>
            ))}
          </div>
          <div className={styles.stageRow}>
            {STAGES.map(([v, l]) => (
              <button
                key={v}
                type="button"
                className={`${styles.stageBtn} ${row.stage === v ? styles.stageBtnOn : ''}`}
                data-stage={v}
                onClick={() => onStage(v)}
              >
                {l}
              </button>
            ))}
          </div>
          <div className={styles.tags}>
            {row.tags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
                <button type="button" aria-label={`Remove tag ${t}`} onClick={() => onPatch({ tags: row.tags.filter((x) => x !== t) })}>
                  ×
                </button>
              </span>
            ))}
            <input
              placeholder="Add tag ↵"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagDraft.trim()) {
                  onPatch({ tags: [...row.tags, tagDraft.trim().toLowerCase()] })
                  setTagDraft('')
                }
              }}
            />
          </div>
          <textarea
            className={styles.notes}
            placeholder="Internal notes (saved when you click away)"
            defaultValue={row.notes}
            rows={3}
            onBlur={(e) => e.target.value !== row.notes && onPatch({ notes: e.target.value })}
          />
          {row.stageHistory.length > 0 && (
            <details className={styles.history}>
              <summary>Stage history</summary>
              <ul>
                {row.stageHistory.map((h, i) => (
                  <li key={i}>
                    {STAGE_LABEL[h.stage] ?? h.stage} · {fmtDate(h.at)}
                    {h.by ? ` · ${h.by}` : ''}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <button type="button" className={styles.danger} onClick={onDelete}>
            Delete applicant data…
          </button>
        </div>
      </div>

      <div className={styles.cv}>
        {cvUrl ? (
          <>
            <iframe src={fitWidth(cvUrl)} title={`CV of ${row.name}`} className={styles.cvFrame} />
            <div className={styles.cvBar}>
              <button type="button" className={styles.cvExpand} onClick={onExpand}>
                Read full screen (v)
              </button>
              <a href={cvUrl} target="_blank" rel="noreferrer noopener" className={styles.cvOpen}>
                Open in new tab (o) ↗
              </a>
            </div>
          </>
        ) : (
          <div className={styles.cvEmpty}>{cvError ?? 'Loading CV…'}</div>
        )}
      </div>
    </div>
  )
}

function FragmentRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  )
}

function Quote({ label, text }: { label: string; text: string }) {
  return (
    <div className={styles.quote}>
      <span className={styles.muted}>{label}</span>
      <p>{text}</p>
    </div>
  )
}

function DeleteDialog({ row, onClose, onDone }: { row: Row; onClose: () => void; onDone: () => void }) {
  const [confirm, setConfirm] = useState('')
  const [reason, setReason] = useState('Applicant requested deletion')
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  async function run() {
    setWorking(true)
    setError(null)
    try {
      await api(`/api/careers/admin/applications/${row.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirm, reason }),
      })
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <div className={styles.modal} role="dialog" aria-modal aria-labelledby="del-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="del-title" className={styles.h2}>
          Delete applicant data
        </h2>
        <p>
          This permanently removes <b>{row.name}</b>’s application and CV (every stored copy). Use it only for an
          applicant’s deletion request. An audit entry is kept, without their personal details.
        </p>
        <label className={styles.modalField}>
          Type the applicant’s email to confirm: <code>{row.email}</code>
          <input autoFocus value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        <label className={styles.modalField}>
          Reason
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        {error && <p className={styles.errorText}>{error}</p>}
        <div className={styles.modalActions}>
          <button type="button" className={styles.btn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.danger}
            disabled={working || confirm.trim().toLowerCase() !== row.email.toLowerCase()}
            onClick={() => void run()}
          >
            {working ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}
