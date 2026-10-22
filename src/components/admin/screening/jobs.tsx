'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './Screening.module.css'

/**
 * Background jobs for the screening desk. Big actions (stage moves, invites,
 * task emails, CV ZIPs, applying agreed reviews) are queued here instead of
 * locking the desk: the founder keeps screening while a panel shows progress.
 *
 * They run in this tab, not on the server — Cloud Run throttles CPU outside a
 * request, so a detached server job isn't reliable. Each job sends its work in
 * small chunks, one request at a time, with a pause between bursts and backoff
 * on rate limits / busy answers, so we never fan out against the DB pool,
 * Resend or the workspace. Jobs run one after another; closing the tab mid-job
 * warns first (anything already sent stays done — the server tags it — so
 * running the action again picks up where it stopped).
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfter: number | null = null,
  ) {
    super(message)
  }
}

export type JobContext = {
  /** progress so far, in the job's own units (people, rows) */
  report: (done: number) => void
}

export type JobSpec = {
  label: string
  /** null = indeterminate (one long request, e.g. a ZIP) */
  total: number | null
  run: (ctx: JobContext) => Promise<JobResult>
  /** after the job ends, success or not — refresh rows etc. */
  onFinish?: () => void
}

/** `href`: a link the founder clicks when it's done (a download must be their own click). */
export type JobResult = { text: string; error?: boolean; href?: string; hrefLabel?: string }

export type Job = {
  id: number
  label: string
  total: number | null
  done: number
  status: 'queued' | 'running' | 'done' | 'error'
  result?: string
  href?: string
  hrefLabel?: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Statuses worth waiting out: rate limited, "already in progress", upstream hiccups. */
const RETRYABLE = new Set([0, 408, 409, 425, 429, 500, 502, 503, 504])
const BACKOFF_MS = [2000, 5000, 15000, 30000]

/** Runs `fn`, retrying transient failures with backoff (honours Retry-After). */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0 // network error → 0
      if (attempt >= BACKOFF_MS.length || !RETRYABLE.has(status)) throw e
      const wait = e instanceof ApiError && e.retryAfter ? e.retryAfter * 1000 : BACKOFF_MS[attempt]
      await sleep(wait)
    }
  }
}

/**
 * Sends `items` in chunks of `size`, one request at a time with `pauseMs`
 * between bursts, reporting progress after each chunk.
 */
export async function inChunks<T>(
  items: T[],
  size: number,
  ctx: JobContext,
  send: (chunk: T[]) => Promise<void>,
  pauseMs = 600,
) {
  let done = 0
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size)
    await withRetry(() => send(chunk))
    done += chunk.length
    ctx.report(done)
    if (i + size < items.length) await sleep(pauseMs)
  }
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const specs = useRef(new Map<number, JobSpec>())
  const nextId = useRef(1)

  const enqueue = useCallback((spec: JobSpec) => {
    const id = nextId.current++
    specs.current.set(id, spec)
    setJobs((js) => [...js, { id, label: spec.label, total: spec.total, done: 0, status: 'queued' }])
  }, [])

  const dismiss = useCallback((id: number) => setJobs((js) => js.filter((j) => j.id !== id)), [])

  const update = (id: number, patch: Partial<Job>) =>
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)))

  // one job at a time, oldest first
  const active = jobs.some((j) => j.status === 'running')
  const nextQueued = jobs.find((j) => j.status === 'queued')?.id
  useEffect(() => {
    if (active || nextQueued === undefined) return
    const id = nextQueued
    const spec = specs.current.get(id)
    if (!spec) return
    update(id, { status: 'running' })
    void (async () => {
      try {
        const r = await spec.run({ report: (done) => update(id, { done }) })
        update(id, { status: r.error ? 'error' : 'done', result: r.text, href: r.href, hrefLabel: r.hrefLabel })
      } catch (e) {
        update(id, { status: 'error', result: (e as Error).message })
      } finally {
        specs.current.delete(id)
        spec.onFinish?.()
      }
    })()
  }, [active, nextQueued])

  // closing the tab would stop the queue — ask first
  const pending = jobs.some((j) => j.status === 'queued' || j.status === 'running')
  useEffect(() => {
    if (!pending) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [pending])

  return { jobs, enqueue, dismiss }
}

export function JobsPanel({ jobs, onDismiss }: { jobs: Job[]; onDismiss: (id: number) => void }) {
  if (jobs.length === 0) return null
  return (
    <div className={styles.jobs} role="region" aria-label="Background jobs">
      {jobs.map((j) => {
        const pct = j.total ? Math.round((j.done / j.total) * 100) : null
        const finished = j.status === 'done' || j.status === 'error'
        return (
          <div key={j.id} className={styles.job} data-status={j.status}>
            <div className={styles.jobHead}>
              <b>{j.label}</b>
              {finished ? (
                <button type="button" aria-label="Dismiss" onClick={() => onDismiss(j.id)}>
                  ×
                </button>
              ) : (
                <span className={styles.muted}>
                  {j.status === 'queued'
                    ? 'Waiting…'
                    : j.total
                      ? `${j.done.toLocaleString('en-IN')} / ${j.total.toLocaleString('en-IN')}`
                      : 'Working…'}
                </span>
              )}
            </div>
            {!finished && (
              <div
                className={styles.jobBar}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct ?? undefined}
                data-indeterminate={pct === null || j.status === 'queued' ? '' : undefined}
              >
                <span style={pct !== null && j.status === 'running' ? { width: `${pct}%` } : undefined} />
              </div>
            )}
            {j.result && <p className={j.status === 'error' ? styles.errorText : undefined}>{j.result}</p>}
            {j.href && (
              <a className={styles.btn} href={j.href}>
                {j.hrefLabel ?? 'Open'}
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}
