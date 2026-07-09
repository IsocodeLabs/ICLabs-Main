'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { useIsDesktop, useIsPhone, useMotionTier, webglAvailable } from '@/lib/capability'
import type { HeroMotionState } from './HeroScene'
import styles from './Hero.module.css'

const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false })

type HeroProps = {
  beliefLine: string
  subline: string
  scrollBeats: string[]
}

/**
 * Hero — Curiosity. A single, steady painterly screen: the belief line over
 * the WebGL scene, which is alive in place (breathing figures, wind in the
 * flora, a breathing laptop glow) but does NOT parallax or scroll-scrub — so
 * scrolling stays precise and returning to the top always shows this same
 * first screen. Mobile/reduced-motion/no-GL: the static composited frame.
 */
export function Hero({ beliefLine, subline }: HeroProps) {
  const tier = useMotionTier()
  const isDesktop = useIsDesktop()
  const isPhone = useIsPhone()

  // WebGL is a desktop treat needing real hardware GL; decided after mount so
  // SSR HTML stays stable. Everything else gets the static composited frame.
  const [glReady, setGlReady] = useState(false)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_WEBGL) {
      console.debug('[hero] static frame — WebGL disabled via env')
    } else if (!webglAvailable()) {
      console.debug('[hero] static frame — no hardware WebGL on this machine')
    } else {
      setGlReady(true)
    }
  }, [])
  const webgl = tier === 'full' && isDesktop && glReady

  // one honest line in the console so "why is it static?" is never a mystery
  useEffect(() => {
    console.debug(
      webgl
        ? '[hero] webgl scene active'
        : `[hero] static frame (motionTier=${tier}, desktop=${isDesktop}, gl=${glReady})`,
    )
  }, [webgl, tier, isDesktop, glReady])

  // the scene animates on its own clock; no scroll/pointer parallax feeds it
  const motion = useMemo<HeroMotionState>(() => ({ progress: 0, px: 0, py: 0 }), [])

  // phones get the portrait crop; tablets/iPad + desktop get the wide composite
  const staticSrc = isPhone ? '/assets/hero/hero-mobile.webp' : '/assets/hero/hero-static.webp'

  return (
    <div className={styles.wrap} id="top">
      <div className={styles.sticky}>
        {/* The static frame is ALWAYS the base layer. When WebGL is available
            the canvas overlays it with the live scene; if the GL context is
            lost, the canvas is removed and this animated still stands — the
            hero can never vanish or flash. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={staticSrc}
          alt="A painter at an easel and a developer at a glowing laptop, at work together in a sunlit wildflower meadow."
          className={styles.staticScene}
          fetchPriority="high"
        />
        {webgl && (
          <div className={styles.scene}>
            <HeroScene motion={motion} onContextLost={() => setGlReady(false)} />
          </div>
        )}
        <div className={styles.grade} aria-hidden />

        <div className={styles.intro}>
          <h1 className={styles.belief}>{formatBelief(beliefLine)}</h1>
          <p className={styles.subline}>{subline}</p>
          <span className={`mono-label ${styles.scrollHint}`} aria-hidden>
            scroll
          </span>
        </div>
      </div>
    </div>
  )
}

/** Emphasise the closing clause with a crafted underline (Anton, one weight). */
function formatBelief(line: string) {
  const marker = 'deserve the best'
  const idx = line.indexOf(marker)
  if (idx === -1) return line
  return (
    <>
      {line.slice(0, idx)}
      <em>{line.slice(idx)}</em>
    </>
  )
}
