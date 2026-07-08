'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useIsDesktop, useMotionTier, webglAvailable } from '@/lib/capability'
import type { HeroMotionState } from './HeroScene'
import styles from './Hero.module.css'

const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false })

type HeroProps = {
  beliefLine: string
  subline: string
  scrollBeats: string[]
}

/**
 * Hero — Curiosity. The WebGL painterly scene with a pinned scroll-reveal
 * text journey: belief line first, then the four beats swap in place,
 * handing off to Problem. Mobile/reduced-motion: static composited frame.
 */
export function Hero({ beliefLine, subline, scrollBeats }: HeroProps) {
  const tier = useMotionTier()
  const isDesktop = useIsDesktop()
  // WebGL is a desktop treat; mobile gets the static composited frame
  // (text journey still runs there — it's cheap and carries the narrative).
  // Requires real hardware GL — software renderers get the still, decided
  // after mount so SSR HTML stays stable.
  const [glReady, setGlReady] = useState(false)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_DISABLE_WEBGL && webglAvailable()) setGlReady(true)
  }, [])
  const webgl = tier === 'full' && isDesktop && glReady

  const wrapRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const beatRefs = useRef<Array<HTMLDivElement | null>>([])
  const motion = useMemo<HeroMotionState>(() => ({ progress: 0, px: 0, py: 0 }), [])

  // pointer parallax (desktop only — no gyro, per PRD)
  useEffect(() => {
    if (!webgl || !isDesktop) return
    const onMove = (e: PointerEvent) => {
      motion.px = (e.clientX / window.innerWidth) * 2 - 1
      motion.py = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [webgl, isDesktop, motion])

  // the scroll journey
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || tier === 'static') return

    const beats = beatRefs.current.filter(Boolean) as HTMLDivElement[]
    const n = beats.length
    // progress windows: intro holds 0→0.18, each beat gets an equal slice after
    const slice = n > 0 ? (1 - 0.22) / n : 1

    const st = ScrollTrigger.create({
      trigger: wrap,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress
        motion.progress = p

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
              i === n - 1
                ? 1 // the last beat stays, handing off to Problem
                : gsap.utils.clamp(0, 1, (end - p) / (slice * 0.28))
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
  }, [tier, motion])

  const staticSrc = isDesktop ? '/hero/hero-static.webp' : '/hero/hero-mobile.webp'
  const isStatic = tier === 'static'

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      id="top"
      style={isStatic ? { height: '100svh' } : undefined}
    >
      <div className={styles.sticky}>
        {webgl ? (
          <div className={styles.scene}>
            <HeroScene motion={motion} onFallback={() => setGlReady(false)} />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={staticSrc}
            alt="A painter at an easel and a developer at a glowing laptop, at work together in a sunlit wildflower meadow."
            className={styles.staticScene}
            fetchPriority="high"
          />
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

/** Mixed display weights on the locked belief line (ui.md: expressive Fraunces). */
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
