'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
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
 * Hero — Curiosity. A pinned scroll-reveal text journey (belief line, then the
 * beats swap in place) over the WebGL painterly scene. The scene is alive in
 * place — breathing figures, wind flora, laptop glow — but does NOT parallax,
 * so scrolling stays precise and the scene never shifts under the pointer.
 * Mobile/reduced-motion/no-GL: the static composited frame.
 */
export function Hero({ beliefLine, subline, scrollBeats }: HeroProps) {
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

  // the live scene cross-fades in only once its FIRST frame has painted, so the
  // handoff from the static poster lands exactly when the sway begins — never a
  // hard swap, never an empty canvas fading in ahead of its textures
  const [sceneReady, setSceneReady] = useState(false)

  // one honest line in the console so "why is it static?" is never a mystery
  useEffect(() => {
    console.debug(
      webgl
        ? '[hero] webgl scene active'
        : `[hero] static frame (motionTier=${tier}, desktop=${isDesktop}, gl=${glReady})`,
    )
  }, [webgl, tier, isDesktop, glReady])

  const wrapRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const beatRefs = useRef<Array<HTMLDivElement | null>>([])
  // the scene animates on its own clock; no scroll/pointer parallax feeds it
  const motion = useMemo<HeroMotionState>(() => ({ progress: 0, px: 0, py: 0 }), [])

  // the scroll journey — the belief line, then the beats swap in place. Pure
  // opacity/nudge on the text; the painterly scene stays put underneath.
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || tier === 'static') return

    const beats = beatRefs.current.filter(Boolean) as HTMLDivElement[]
    const n = beats.length
    const slice = n > 0 ? (1 - 0.22) / n : 1

    const st = ScrollTrigger.create({
      trigger: wrap,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress

        // intro: visible until 0.1, fades out by 0.2
        if (introRef.current) {
          const fade = gsap.utils.clamp(0, 1, (0.2 - p) / 0.1)
          introRef.current.style.opacity = `${fade}`
          introRef.current.style.transform = `translateY(${(1 - fade) * -26}px)`
        }

        beats.forEach((beat, i) => {
          const start = 0.22 + i * slice
          const mid = start + slice * 0.5
          const end = start + slice
          let o = 0
          if (p >= start && p <= end) {
            const inT = gsap.utils.clamp(0, 1, (p - start) / (slice * 0.28))
            const outT =
              i === n - 1 ? 1 : gsap.utils.clamp(0, 1, (end - p) / (slice * 0.28))
            o = Math.min(inT, outT)
          } else if (i === n - 1 && p > end) {
            o = 1
          }
          beat.style.opacity = `${o}`
          const drift = p >= mid ? 0 : (1 - gsap.utils.clamp(0, 1, (p - start) / (slice * 0.5))) * 18
          beat.style.transform = `translateY(${drift}px)`
        })
      },
    })
    return () => st.kill()
  }, [tier])

  // phones get the portrait crop; tablets/iPad + desktop get the wide composite
  const staticSrc = isPhone ? '/assets/hero/hero-mobile.webp' : '/assets/hero/hero-static.webp'
  const isStatic = tier === 'static'

  return (
    <div ref={wrapRef} className={styles.wrap} id="top" style={isStatic ? { height: '100svh' } : undefined}>
      {/* Warm the three layer textures the moment the hero mounts so the live
          scene boots fast and the static-poster glimpse before it is minimal.
          Desktop-only — phones/tablets never load the WebGL layers. */}
      {isDesktop && !isStatic && (
        <>
          <link rel="preload" as="image" href="/assets/hero/hero-l1-sky.png" />
          <link rel="preload" as="image" href="/assets/hero/hero-l2-figures.png" />
          <link rel="preload" as="image" href="/assets/hero/hero-l3-flora.png" />
        </>
      )}
      <div className={styles.sticky}>
        {/* The static frame is ALWAYS the base layer. When WebGL is available
            the canvas overlays it (fading in) with the live scene; if the GL
            context is lost, the canvas is removed and this animated still
            stands — the hero can never vanish or flash white. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={staticSrc}
          alt="A painter at an easel and a developer at a glowing laptop, at work together in a sunlit wildflower meadow."
          className={styles.staticScene}
          fetchPriority="high"
        />
        {webgl && (
          <div className={`${styles.scene} ${sceneReady ? styles.sceneReady : ''}`}>
            <HeroScene
              motion={motion}
              onReady={() => setSceneReady(true)}
              onContextLost={() => {
                setSceneReady(false)
                setGlReady(false)
              }}
            />
          </div>
        )}
        <div className={styles.grade} aria-hidden />

        <div ref={introRef} className={styles.intro}>
          <h1 className={styles.belief}>{formatBelief(beliefLine)}</h1>
          <p className={styles.subline}>{subline}</p>
          <span className={`mono-label ${styles.scrollHint}`} aria-hidden>
            scroll
          </span>
        </div>

        {/* at reduced motion the still frame stands alone; the narrative
            carries on in Problem — no empty scroll theatre */}
        {!isStatic &&
          scrollBeats.map((text, i) => (
            <div
              key={i}
              ref={(el) => {
                beatRefs.current[i] = el
              }}
              className={styles.beat}
            >
              <div className={styles.beatCard}>
                <p className={styles.beatText}>{text}</p>
              </div>
            </div>
          ))}
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
