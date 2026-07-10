'use client'

import { useIsDesktop, useIsPhone, useMotionTier } from '@/lib/capability'
import styles from './CareersWorld.module.css'

/**
 * The Careers world — the dark "craftsmanship at work" atelier. Same anchor-world
 * mechanism as the homepage's WorldBackground, dark register and swapped inputs:
 * a base desk plate (slow ken-burns drift) + a foreground botanical layer that
 * sways, over an ink veil that keeps white copy legible. No flora band, no scroll
 * journey — ambient CSS motion only, gated by the motion tier.
 *
 * Phone / iPad get one still, cover-fitted device crop (same pattern as the hero
 * device backdrops), no motion.
 */
export function CareersWorld() {
  const tier = useMotionTier()
  const isDesktop = useIsDesktop()
  const isPhone = useIsPhone()

  const shared = !isDesktop
  const sharedSrc = isPhone
    ? '/assets/careers/careers-phone.jpg'
    : '/assets/careers/careers-ipad.jpg'

  if (shared) {
    return (
      <div aria-hidden className={styles.root}>
        <div className={styles.sharedPlate} style={{ backgroundImage: `url('${sharedSrc}')` }} />
        <div className={styles.sharedScrim} />
      </div>
    )
  }

  return (
    <div aria-hidden className={`${styles.root} ${tier === 'static' ? styles.still : ''}`}>
      <div className={styles.plate} />
      <div className={styles.layer} />
      <div className={styles.scrim} />
    </div>
  )
}
