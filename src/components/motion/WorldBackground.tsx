'use client'

import { useEffect, useRef } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import { useIsDesktop, useIsPhone, useMotionTier } from '@/lib/capability'
import styles from './WorldBackground.module.css'

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
 */
export function WorldBackground() {
  const plateRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const floraRef = useRef<HTMLDivElement>(null)
  const tier = useMotionTier()
  const isPhone = useIsPhone()
  const isDesktop = useIsDesktop()

  // phone + iPad share one still, cover-fitted image behind the whole page
  const shared = !isDesktop
  const sharedSrc = isPhone ? '/assets/hero/hero-phone.jpg' : '/assets/hero/hero-ipad.jpg'

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

  // ── phone / iPad: one still image behind everything, plus a legibility scrim
  if (shared) {
    return (
      <div aria-hidden className={styles.root}>
        <div className={styles.sharedPlate} style={{ backgroundImage: `url('${sharedSrc}')` }} />
        <div className={styles.sharedScrim} />
      </div>
    )
  }

  // ── desktop: the living sky + flora stage
  return (
    <div aria-hidden className={styles.root}>
      <div ref={plateRef} className={styles.plate} />
      <div ref={scrimRef} className={styles.scrim} />
      <div ref={floraRef} className={styles.flora}>
        <div className={styles.floraSway} />
      </div>
    </div>
  )
}
