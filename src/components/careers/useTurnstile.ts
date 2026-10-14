'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Cloudflare Turnstile (the "are you human" check before a CV upload slot).
 *
 * Managed mode, invisible unless Cloudflare wants an interaction — and for a
 * real share of visitors (phones, in-app browsers like LinkedIn's, VPNs, shared
 * campus networks) it does: a "Verify you are human" box appears. That box has
 * to be where the applicant is looking, and the upload has to wait for it
 * rather than time out, so this hook:
 *
 * - prepare(): starts the check as soon as the form is first touched, so the
 *   token is usually ready before a CV is picked (tokens last 300 s; cached
 *   for 240 s, refreshed if Cloudflare expires one)
 * - getToken(): hands out the ready token, or runs the check and waits.
 *   No timeout while an interaction is pending; a 45 s safety timeout only
 *   covers a widget that never answers at all.
 * - status: 'interactive' while the visitor needs to tick the box, so the form
 *   can say so next to the CV field (where the widget is rendered).
 *
 * Tokens are single-use: one per upload slot. When the check is switched off
 * (CAREERS_HUMAN_CHECK, passed in as `on`) or there's no site key (local dev),
 * nothing loads and getToken() returns ''.
 */
type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  execute: (id: string) => void
  reset: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export type TurnstileStatus = 'idle' | 'checking' | 'interactive' | 'ready' | 'error'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const TOKEN_TTL_MS = 240_000
const SILENT_TIMEOUT_MS = 45_000

let scriptPromise: Promise<TurnstileApi> | null = null
function loadScript(): Promise<TurnstileApi> {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      if (window.turnstile) return resolve(window.turnstile)
      const s = document.createElement('script')
      s.src = SCRIPT_SRC
      s.async = true
      s.defer = true
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile script')))
      s.onerror = () => {
        scriptPromise = null
        reject(new Error('turnstile script'))
      }
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

type Waiter = { resolve: (token: string) => void; reject: (e: Error) => void; timer?: ReturnType<typeof setTimeout> }

export function useTurnstile(on = true) {
  const enabled = Boolean(SITE_KEY) && on
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<string | null>(null)
  const tokenRef = useRef<{ token: string; at: number } | null>(null)
  const waitersRef = useRef<Waiter[]>([])
  const runningRef = useRef(false)
  const [status, setStatus] = useState<TurnstileStatus>('idle')

  useEffect(() => {
    if (!enabled) return
    // warm the script so the check can start the moment the form is touched
    loadScript().catch(() => {})
  }, [])

  const api = useMemo(() => {
    const fail = (message: string) => {
      runningRef.current = false
      setStatus('error')
      const waiting = waitersRef.current
      waitersRef.current = []
      for (const w of waiting) {
        clearTimeout(w.timer)
        w.reject(new Error(message))
      }
    }

    const run = (ts: TurnstileApi, id: string) => {
      if (runningRef.current) return
      runningRef.current = true
      setStatus('checking')
      ts.reset(id)
      ts.execute(id)
    }

    async function ensureWidget(): Promise<{ ts: TurnstileApi; id: string }> {
      const ts = await loadScript()
      if (!widgetRef.current && containerRef.current) {
        widgetRef.current = ts.render(containerRef.current, {
          sitekey: SITE_KEY,
          execution: 'execute',
          appearance: 'interaction-only',
          theme: 'dark',
          // the normal box is 300px wide; narrow phones get the compact one
          // (measure the field it sits in: the container itself is empty, so 0px, until now)
          size: (containerRef.current.parentElement?.clientWidth ?? 0) < 300 ? 'compact' : 'flexible',
          'refresh-expired': 'manual',
          callback: (token: string) => {
            runningRef.current = false
            const w = waitersRef.current.shift()
            if (w) {
              clearTimeout(w.timer)
              setStatus('idle')
              w.resolve(token)
              // another upload is also waiting (rare): run the check again for it
              if (waitersRef.current.length && widgetRef.current) run(ts, widgetRef.current)
            } else {
              tokenRef.current = { token, at: Date.now() }
              setStatus('ready')
            }
          },
          'before-interactive-callback': () => {
            setStatus('interactive')
            // a person has to act now — don't time them out
            for (const w of waitersRef.current) clearTimeout(w.timer)
          },
          'after-interactive-callback': () => setStatus('checking'),
          'expired-callback': () => {
            tokenRef.current = null
            setStatus('idle')
          },
          'timeout-callback': () => fail('turnstile timeout'),
          'error-callback': () => fail('turnstile error'),
        })
      }
      if (!widgetRef.current) throw new Error('turnstile container missing')
      return { ts, id: widgetRef.current }
    }

    /** Start the check early (first touch of the form). Never throws. */
    async function prepare() {
      if (!enabled || runningRef.current) return
      const cached = tokenRef.current
      if (cached && Date.now() - cached.at < TOKEN_TTL_MS) return
      try {
        const { ts, id } = await ensureWidget()
        run(ts, id)
      } catch {
        // surfaced when an upload actually needs the token
      }
    }

    /** A single-use token for one upload slot. */
    async function getToken(): Promise<string> {
      if (!enabled) return ''
      const cached = tokenRef.current
      tokenRef.current = null
      if (cached && Date.now() - cached.at < TOKEN_TTL_MS) {
        setStatus('idle')
        return cached.token
      }
      const { ts, id } = await ensureWidget()
      return new Promise<string>((resolve, reject) => {
        const waiter: Waiter = { resolve, reject }
        waiter.timer = setTimeout(() => {
          waitersRef.current = waitersRef.current.filter((w) => w !== waiter)
          runningRef.current = false
          setStatus('error')
          reject(new Error('turnstile timeout'))
        }, SILENT_TIMEOUT_MS)
        waitersRef.current.push(waiter)
        run(ts, id)
      })
    }

    return { enabled, containerRef, prepare, getToken }
  }, [enabled])

  return { ...api, status }
}
