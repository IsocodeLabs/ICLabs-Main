'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useIsDesktop, useIsPhone, useMotionTier } from '@/lib/capability'
import styles from './Hero.module.css'

type HeroProps = {
  beliefLine: string
  subline: string
  scrollBeats: string[]
}

/**
 * Hero — Curiosity. A pinned scroll-reveal text journey (belief line, then the
 * beats swap in place) over the painterly scene.
 *
 * The scene is plain layered images (the same art the poster is composited
 * from) given life with cheap CSS transforms — whole-scene drift, figures
 * breathing from the ground up, grass swaying about its roots, a pulsing
 * laptop glow. No WebGL: the browser composites the PNGs pixel-true (custom
 * GL shaders skipped the linear→sRGB output encode and shifted the colours),
 * and nothing competes with scrolling for the GPU.
 *
 * At the end of the journey the scene fades out IN PLACE, revealing the world
 * stage behind — the hero dissolves into the site instead of scrolling away.
 * Phones/tablets/reduced-motion get the static composited frame.
 */
export function Hero({ beliefLine, subline, scrollBeats }: HeroProps) {
  const tier = useMotionTier()
  const isDesktop = useIsDesktop()
  const isPhone = useIsPhone()

  // the layered living scene is a desktop treat; smaller screens get the still
  const layered = tier === 'full' && isDesktop

  const wrapRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const beatRefs = useRef<Array<HTMLDivElement | null>>([])

  // the scroll journey — the belief line, then the beats swap in place. Pure
  // opacity/nudge on the text; the painterly scene stays put underneath.
  useEffect(() => {
    const wrap = wrapRef.current
    const sticky = stickyRef.current
    if (!wrap || !sticky || tier === 'static') return

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

        // the in-place farewell: over the last stretch the whole scene (and
        // the final beat) fade where they stand, revealing the world stage
        // behind — the hero dissolves into the site instead of scrolling off
        const bye = gsap.utils.clamp(0, 1, (p - 0.9) / 0.1)
        sticky.style.opacity = `${1 - bye}`
      },
    })
    return () => st.kill()
  }, [tier])

  // phones get the portrait crop; tablets/iPad + desktop get the wide composite
  const staticSrc = isPhone ? '/assets/hero/hero-mobile.webp' : '/assets/hero/hero-static.webp'
  const isStatic = tier === 'static'
  const sceneAlt =
    'A painter at an easel and a developer at a glowing laptop, at work together in a sunlit wildflower meadow.'

  return (
    <div ref={wrapRef} className={styles.wrap} id="top" style={isStatic ? { height: '100svh' } : undefined}>
      <div ref={stickyRef} className={styles.sticky}>
        {layered ? (
          /* the living scene: sky base, breathing figures, pulsing laptop
             glow, swaying grass — all transforms, all cheap */
          <div className={styles.scene} role="img" aria-label={sceneAlt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/hero/hero-l1-sky.png" alt="" className={styles.layer} fetchPriority="high" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/hero/hero-l2-figures.png"
              alt=""
              className={`${styles.layer} ${styles.figuresLayer}`}
              fetchPriority="high"
            />
            <div className={styles.frame} aria-hidden>
              <div className={styles.glow} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/hero/hero-l3-flora.png" alt="" className={`${styles.layer} ${styles.floraLayer}`} />
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={staticSrc} alt={sceneAlt} className={styles.staticScene} fetchPriority="high" />
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
