'use client'

import { useEffect, useRef } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import { useIsDesktop, useMotionTier } from '@/lib/capability'
import { artVars } from '@/lib/art'
import skyAvif from '@/assets/art/world-sky.avif'
import skyWebp from '@/assets/art/world-sky.webp'
import floraAvif from '@/assets/art/world-flora.avif'
import floraWebp from '@/assets/art/world-flora.webp'
import ipadAvif from '@/assets/art/world-ipad.avif'
import ipadWebp from '@/assets/art/world-ipad.webp'
import phoneAvif from '@/assets/art/world-phone.avif'
import phoneWebp from '@/assets/art/world-phone.webp'
import styles from './WorldBackground.module.css'

const ART = artVars({
  'world-sky': { avif: skyAvif, webp: skyWebp },
  'world-flora': { avif: floraAvif, webp: floraWebp },
  'world-ipad': { avif: ipadAvif, webp: ipadWebp },
  'world-phone': { avif: phoneAvif, webp: phoneWebp },
})

/**
 * The site's one fixed painterly stage, behind every section including the hero.
 *
 * Desktop: a sky plate up top (slow drift + scroll parallax) and a flora band
 * pinned to the bottom that ebbs on scroll — the scene evolves in place while
 * content scrolls over it.
 *
 * Phone / iPad: no motion, and no separate hero backdrop — a single device-
 * composed image (the same one the hero sits on) is fixed and cover-fitted
 * behind the whole page, so the hero and the sections below share one seamless
 * background with no tiling seam and no crop mismatch. A paper scrim keeps the
 * scrolling copy legible over it.
 *
 * Both sets are always rendered; CSS media queries show one. That way the
 * server-rendered page is right for the device before any JS runs, and the
 * browser only downloads the art of the layers it displays (hidden layers'
 * background images are never fetched). Art comes from src/assets/art
 * (AVIF + WebP, content-hashed, cached for a year — see scripts/build-art.mjs).
 */
export function WorldBackground() {
  const plateRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const floraRef = useRef<HTMLDivElement>(null)
  const tier = useMotionTier()
  const isDesktop = useIsDesktop()

  // phone + iPad share one still, cover-fitted image (CSS picks it); no motion
  const shared = !isDesktop

  useEffect(() => {
    // scroll-driven evolution is a desktop, full-motion affair only
    if (shared || tier === 'static') return
    const plate = plateRef.current
    const scrim = scrimRef.current
    const flora = floraRef.current
    if (!plate || !scrim || !flora) return

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.25,
      onUpdate: (self) => {
        const p = self.progress
        // slow parallax drift — the plate lags the page, but never scrolls off
        plate.style.transform = `translate3d(0, ${(-p * 6).toFixed(2)}vh, 0) scale(1.06)`
        // atmosphere: a touch more paper scrim as we descend
        scrim.style.opacity = `${(0.16 + p * 0.32).toFixed(3)}`
        // flora ebbs in place — fades + drifts as the scene changes, pinned
        const ebb = Math.sin(p * Math.PI * 3.2)
        flora.style.opacity = `${(0.82 + ebb * 0.18).toFixed(3)}`
        flora.style.transform = `translate3d(0, ${(ebb * 2.2).toFixed(2)}vh, 0)`
      },
    })
    return () => st.kill()
  }, [tier, shared])

  return (
    <div aria-hidden className={styles.root} style={ART}>
      {/* desktop (≥ 1025px): the living sky + flora stage */}
      <div ref={plateRef} className={styles.plate}>
        <div className={styles.plateDrift} />
      </div>
      <div ref={scrimRef} className={styles.scrim} />
      <div ref={floraRef} className={styles.flora}>
        <div className={styles.floraSway} />
      </div>
      {/* phone / iPad (≤ 1024px): one still image behind everything + legibility scrim */}
      <div className={styles.sharedPlate} />
      <div className={styles.sharedScrim} />
    </div>
  )
}
