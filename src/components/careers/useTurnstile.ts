'use client'

import { useEffect, useMemo, useRef } from 'react'

/**
 * Cloudflare Turnstile, managed + invisible unless a challenge is really needed
 * (`appearance: interaction-only`). Tokens are single-use, so every upload slot
 * request gets a fresh one: getToken() resets and re-executes the widget.
 * With no NEXT_PUBLIC_TURNSTILE_SITE_KEY (local dev) it's a no-op.
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

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise: Promise<TurnstileApi> | null = null
function loadScript(): Promise<TurnstileApi> {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      if (window.turnstile) return resolve(window.turnstile)
      const s = document.createElement('script')
      s.src = SCRIPT_SRC
      s.async = true
      s.defer = true
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')))
      s.onerror = () => {
        scriptPromise = null
        reject(new Error('turnstile script'))
      }
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

export function useTurnstile() {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<string | null>(null)
  const pendingRef = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null)

  useEffect(() => {
    if (!SITE_KEY) return
    // warm the script so the first upload isn't waiting on it
    loadScript().catch(() => {})
  }, [])

  return useMemo(() => {
    async function ensureWidget(): Promise<{ api: TurnstileApi; id: string }> {
      const api = await loadScript()
      if (!widgetRef.current && containerRef.current) {
        widgetRef.current = api.render(containerRef.current, {
          sitekey: SITE_KEY,
          execution: 'execute',
          appearance: 'interaction-only',
          theme: 'dark',
          callback: (token: string) => {
            pendingRef.current?.resolve(token)
            pendingRef.current = null
          },
          'error-callback': () => {
            pendingRef.current?.reject(new Error('turnstile error'))
            pendingRef.current = null
          },
        })
      }
      if (!widgetRef.current) throw new Error('turnstile container missing')
      return { api, id: widgetRef.current }
    }

    async function getToken(): Promise<string> {
      if (!SITE_KEY) return ''
      const { api, id } = await ensureWidget()
      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingRef.current = null
          reject(new Error('turnstile timeout'))
        }, 60_000)
        pendingRef.current = {
          resolve: (t) => {
            clearTimeout(timer)
            resolve(t)
          },
          reject: (e) => {
            clearTimeout(timer)
            reject(e)
          },
        }
        api.reset(id)
        api.execute(id)
      })
    }

    return { enabled: Boolean(SITE_KEY), containerRef, getToken }
  }, [])
}
