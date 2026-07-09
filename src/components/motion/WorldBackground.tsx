'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useMotionTier } from '@/lib/capability'
import styles from './WorldBackground.module.css'

/**
 * The hero's world, everywhere (ui-trial §"section treatment"). ONE light
 * painterly sky plate runs fixed behind every section below the hero. It does
 * not switch images — instead a single overlay shifts value + warmth on scroll
 * (one evolving atmosphere), and the plate parallaxes slower than the content
 * so scrolling feels like travel. Reduced motion → static plate, steady scrim.
 */
export function WorldBackground() {
  const plateRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const tier = useMotionTier()

  useEffect(() => {
    const plate = plateRef.current
    const scrim = scrimRef.current
    if (!plate || !scrim) return
    if (tier === 'static') return

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress
        // slow parallax drift — the plate lags the page
        plate.style.transform = `translate3d(0, ${(-p * 8).toFixed(2)}vh, 0) scale(1.06)`
        // atmosphere: a touch more paper scrim as we descend (legibility +
        // "evening" settle), never fully hiding the sky
        scrim.style.opacity = `${(0.18 + p * 0.34).toFixed(3)}`
      },
    })
    return () => st.kill()
  }, [tier])

  return (
    <div aria-hidden className={styles.root}>
      <div ref={plateRef} className={styles.plate} />
      <div ref={scrimRef} className={styles.scrim} />
    </div>
  )
}
