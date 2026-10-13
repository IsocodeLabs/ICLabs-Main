'use client'

import { useMotionTier } from '@/lib/capability'
import styles from './CareersWorld.module.css'

/**
 * The Careers world — the dark "craftsmanship at work" atelier. Same anchor-world
 * mechanism as the homepage's WorldBackground, dark register and swapped inputs:
 * a base desk plate (slow ken-burns drift) + a foreground botanical layer that
 * sways, over an ink veil that keeps white copy legible. No flora band, no scroll
 * journey — ambient CSS motion only, gated by the motion tier.
 *
 * Phone / iPad get one still, cover-fitted device crop (same pattern as the hero
 * device backdrops), no motion. Which set shows is decided by CSS media queries,
 * not JS: the server-rendered page is already right for the device, and the
 * browser only downloads the plates for the layers it actually displays.
 */
export function CareersWorld() {
  const tier = useMotionTier()

  return (
    <div aria-hidden className={`${styles.root} ${tier === 'static' ? styles.still : ''}`}>
      {/* desktop (≥ 1025px) */}
      <div className={styles.plate} />
      <div className={styles.layer} />
      <div className={styles.scrim} />
      {/* iPad / phone (≤ 1024px) */}
      <div className={styles.sharedPlate} />
      <div className={styles.sharedScrim} />
    </div>
  )
}
