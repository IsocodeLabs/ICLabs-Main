'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useMotionTier } from '@/lib/capability'
import styles from './WorldBackground.module.css'

/**
 * The hero's world, everywhere (ui-trial §"section treatment"). ONE fixed
 * painterly stage runs behind every section below the hero: a sky plate up top
 * and a flora band pinned to the bottom of the viewport. Nothing scrolls away —
 * the content scrolls OVER the stage, and the stage evolves *in place*: the sky
 * scrim shifts value/warmth and the flora ebbs (fades + drifts) on scroll, plus
 * a constant gentle sway. Reduced motion → a steady, still stage.
 */
export function WorldBackground() {
  const plateRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const floraRef = useRef<HTMLDivElement>(null)
  const tier = useMotionTier()

  useEffect(() => {
    const plate = plateRef.current
    const scrim = scrimRef.current
    const flora = floraRef.current
    if (!plate || !scrim || !flora) return
    if (tier === 'static') return

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
  }, [tier])

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
