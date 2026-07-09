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
    // Accept any working context — a context-loss handler catches crashes at
    // runtime, so we don't need to pre-reject on performance caveat.
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    // Note: do NOT call loseContext() here — explicitly destroying a context
    // right before R3F creates its own churns GPU state (and on some Macs
    // nudges a GPU switch that kills the real hero context). Let it GC.
    glOK = !!gl
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
