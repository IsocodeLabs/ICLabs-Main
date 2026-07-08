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

let glOK: boolean | null = null

/**
 * True only when a real, hardware-accelerated WebGL context is available.
 * Software renderers (GPU-blocklisted machines, some VMs) must get the
 * static frame — a janky or hung hero refutes the brand harder than a still.
 */
export function webglAvailable(): boolean {
  if (typeof window === 'undefined') return false
  if (glOK !== null) return glOK
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
    if (gl) {
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      glOK = true
    } else {
      glOK = false
    }
  } catch {
    glOK = false
  }
  return glOK
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
