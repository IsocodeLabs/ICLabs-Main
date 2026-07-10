'use client'

import { useSyncExternalStore } from 'react'

/**
 * The single motion gate (ux.md law 1 + progressive enhancement).
 * Everything cinematic — trail, hero WebGL, ambient motion — asks this first.
 */

export type MotionTier = 'full' | 'reduced' | 'static'

function computeTier(): MotionTier {
  if (typeof window === 'undefined') return 'full'
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static'

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
    deviceMemory?: number
  }
  if (nav.connection?.saveData) return 'static'
  if (nav.connection?.effectiveType && /(^|-)2g/.test(nav.connection.effectiveType)) return 'static'
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return 'reduced'
  return 'full'
}

let tier: MotionTier | null = null

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const handler = () => {
    tier = null
    cb()
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}

export function useMotionTier(): MotionTier {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (tier === null) tier = computeTier()
      return tier
    },
    () => 'full' as MotionTier,
  )
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(min-width: 1025px)')
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia('(min-width: 1025px)').matches,
    () => true,
  )
}

/** Phones (portrait). Tablets/iPad count as false so they get the wide art. */
export function useIsPhone(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(max-width: 767px)')
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia('(max-width: 767px)').matches,
    () => false,
  )
}
