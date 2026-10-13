'use client'

import { useIsDesktop, useMotionTier } from '@/lib/capability'
import { artVars } from '@/lib/art'
import baseAvif from '@/assets/art/careers-base.avif'
import baseWebp from '@/assets/art/careers-base.webp'
import styles from './CareersWorld.module.css'

const ART = artVars({ 'careers-base': { avif: baseAvif, webp: baseWebp } })

/**
 * The Careers world — the dark "craftsmanship at work" atelier. Same anchor-world
 * mechanism as the homepage's WorldBackground, dark register: one desk plate
 * under an ink veil that keeps white copy legible. Nothing floats over it — no
 * foreground layer, no flora band, no scroll journey.
 *
 * Desktop drifts the plate slowly (ambient CSS motion, gated by the motion
 * tier); phone / iPad hold it still, cover-fitted.
 */
export function CareersWorld() {
  const tier = useMotionTier()
  const isDesktop = useIsDesktop()
  const still = tier === 'static' || !isDesktop

  return (
    <div aria-hidden className={`${styles.root} ${still ? styles.still : ''}`} style={ART}>
      <div className={styles.plate} />
      <div className={styles.scrim} />
    </div>
  )
}
