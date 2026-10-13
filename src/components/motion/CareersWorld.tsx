'use client'

import { useMotionTier } from '@/lib/capability'
import { artVars } from '@/lib/art'
import baseAvif from '@/assets/art/careers-base.avif'
import baseWebp from '@/assets/art/careers-base.webp'
import layerAvif from '@/assets/art/careers-layer.avif'
import layerWebp from '@/assets/art/careers-layer.webp'
import ipadAvif from '@/assets/art/careers-ipad.avif'
import ipadWebp from '@/assets/art/careers-ipad.webp'
import phoneAvif from '@/assets/art/careers-phone.avif'
import phoneWebp from '@/assets/art/careers-phone.webp'
import styles from './CareersWorld.module.css'

const ART = artVars({
  'careers-base': { avif: baseAvif, webp: baseWebp },
  'careers-layer': { avif: layerAvif, webp: layerWebp },
  'careers-ipad': { avif: ipadAvif, webp: ipadWebp },
  'careers-phone': { avif: phoneAvif, webp: phoneWebp },
})

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
    <div aria-hidden className={`${styles.root} ${tier === 'static' ? styles.still : ''}`} style={ART}>
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
