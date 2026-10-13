'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CAREERS_URL } from '@/lib/careers/urls'
import { pageKindOf, planFor, roleSlugOf, type Step } from '@/lib/warmup/plan'
import { detectSource } from '@/lib/warmup/source'

/**
 * Predictive warm-up. Once the page the visitor asked for has finished loading,
 * quietly fetch what they're most likely to open next, in priority order (the
 * order lives in lib/warmup/plan.ts), so the next click is instant.
 *
 * It is deliberately polite:
 *   - starts only after `load`, then waits for the browser to be idle
 *   - one request at a time, never competing with what's on screen
 *   - skipped entirely on Data Saver and on 2g; trimmed on 3g
 *   - stops the moment the visitor leaves the page
 *   - production only (dev has no prefetching; set ?warmup=debug to log the plan)
 *
 * Where the visitor came from is read on-device (lib/warmup/source.ts) and never
 * sent anywhere.
 */

type Props = {
  /** slugs of the open named roles, in display order */
  roleSlugs: string[]
}

/** Warmed once per tab, across client navigations. */
const warmed = new Set<string>()

const OUR_SITE = /(^|\.)isocodelabs\.com$/i

type NetworkInfo = { saveData?: boolean; effectiveType?: string }

const debugOn = () => {
  try {
    return (
      /[?&]warmup=debug\b/.test(location.search) || localStorage.getItem('il.warmup.debug') === '1'
    )
  } catch {
    return false
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** resolves when the browser has nothing better to do (or after `timeout`) */
function idle(timeout = 1500): Promise<void> {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  }
  return new Promise((resolve) => {
    if (w.requestIdleCallback) w.requestIdleCallback(() => resolve(), { timeout })
    else setTimeout(resolve, 250)
  })
}

const supportsPrefetch = (() => {
  let v: boolean | null = null
  return () => {
    if (v === null) {
      try {
        v = document.createElement('link').relList.supports('prefetch')
      } catch {
        v = false
      }
    }
    return v
  }
})()

/** <link rel=…> into <head>; resolves once the fetch settles (or after 3s). */
function addLink(attrs: Record<string, string>, waitForLoad: boolean): Promise<void> {
  return new Promise((resolve) => {
    const link = document.createElement('link')
    for (const [k, v] of Object.entries(attrs)) link.setAttribute(k, v)
    if (!waitForLoad) {
      document.head.appendChild(link)
      resolve()
      return
    }
    const timer = setTimeout(resolve, 3000)
    const finish = () => {
      clearTimeout(timer)
      resolve()
    }
    link.onload = finish
    link.onerror = finish
    document.head.appendChild(link)
  })
}

/** This page's own static JS / CSS / fonts, re-addressed to another origin. */
function mirrorTargets(origin: string): Array<Record<string, string>> {
  const out: Array<Record<string, string>> = []
  const seen = new Set<string>()
  const add = (path: string, as: string, extra: Record<string, string> = {}) => {
    if (!path.startsWith('/_next/static/') || seen.has(path)) return
    seen.add(path)
    out.push({ rel: 'prefetch', as, href: origin + path, ...extra })
  }
  // fonts first (they gate text), then CSS, then JS
  document
    .querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="font"]')
    .forEach((l) => add(new URL(l.href, location.href).pathname, 'font', { crossorigin: 'anonymous' }))
  document
    .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    .forEach((l) => add(new URL(l.href, location.href).pathname, 'style'))
  document
    .querySelectorAll<HTMLScriptElement>('script[src]')
    .forEach((s) => add(new URL(s.src, location.href).pathname, 'script'))
  return out.slice(0, 40)
}

const stepKey = (s: Step) =>
  s.kind === 'connect' ? `connect:${s.origin}` : `${s.kind}:${(s as { href: string }).href}`

export function Warmup({ roleSlugs }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const roleKey = roleSlugs.join(',')

  useEffect(() => {
    const debug = debugOn()
    const log = (...a: unknown[]) => debug && console.info('[warmup]', ...a)

    const onCareersHost = location.hostname.startsWith('careers.')
    const source = detectSource()
    const page = pageKindOf(location.pathname, onCareersHost)
    const steps = planFor({
      source,
      page,
      careersOrigin: CAREERS_URL,
      roleSlugs: roleKey ? roleKey.split(',') : [],
      onCareersHost,
      currentRole: roleSlugOf(location.pathname),
    })
    log('source', source, '| page', page, '| plan', steps)

    // dev has no real prefetching to rehearse; just show the plan under ?warmup=debug
    if (process.env.NODE_ENV !== 'production') return
    if (steps.length === 0) return

    const conn = (navigator as Navigator & { connection?: NetworkInfo }).connection
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? '')) {
      log('skipped: data saver / 2g')
      return
    }
    let budget = conn?.effectiveType === '3g' ? 3 : Infinity

    let alive = true

    async function execute(step: Step) {
      const key = stepKey(step)
      if (warmed.has(key)) return
      warmed.add(key)
      log('→', step)

      switch (step.kind) {
        case 'connect':
          // one for fetch/XHR-style (CORS) use, one for navigations and images
          await addLink({ rel: 'preconnect', href: step.origin, crossorigin: 'anonymous' }, false)
          await addLink({ rel: 'preconnect', href: step.origin }, false)
          break
        case 'route':
          router.prefetch(step.href)
          break
        case 'image':
          if (supportsPrefetch()) await addLink({ rel: 'prefetch', as: 'image', href: step.href }, true)
          break
        case 'document': {
          if (!supportsPrefetch()) break
          await addLink({ rel: 'prefetch', as: 'document', href: step.href }, true)
          if (step.mirror) {
            const origin = new URL(step.href, location.href).origin
            for (const t of mirrorTargets(origin)) {
              if (!alive) return
              if (warmed.has(`asset:${t.href}`)) continue
              warmed.add(`asset:${t.href}`)
              await idle(800)
              await addLink(t, true)
            }
          }
          break
        }
      }
    }

    async function run() {
      // let the page the visitor asked for finish first
      if (document.readyState !== 'complete') {
        await new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true }))
      }
      await sleep(1200)

      for (const step of steps) {
        if (!alive || budget <= 0) return
        // never warm while the tab is in the background
        while (alive && document.visibilityState !== 'visible') await sleep(1000)
        await idle()
        if (!alive) return
        await execute(step)
        budget -= 1
        await sleep(150)
      }
      log('plan complete')
    }
    void run()

    // Intent beats prediction: the moment someone points at / touches / focuses a
    // link to another part of our site, fetch it right away, ahead of the queue.
    // (Same-origin <Link>s are already prefetched by Next.)
    const onIntent = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a) return
      let url: URL
      try {
        url = new URL(a.href, location.href)
      } catch {
        return
      }
      // only the careers site is a separate Next app we know how to warm
      if (url.origin === location.origin || !/^careers\./i.test(url.hostname)) return
      if (!OUR_SITE.test(url.hostname) && !CAREERS_URL) return
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return
      void execute({ kind: 'document', href: url.href, mirror: true })
    }
    document.addEventListener('pointerover', onIntent, { passive: true })
    document.addEventListener('touchstart', onIntent, { passive: true })
    document.addEventListener('focusin', onIntent)

    return () => {
      alive = false
      document.removeEventListener('pointerover', onIntent)
      document.removeEventListener('touchstart', onIntent)
      document.removeEventListener('focusin', onIntent)
    }
    // re-plan per page; roleSlugs is stable for a given build/ISR render
  }, [pathname, roleKey, router])

  return null
}
