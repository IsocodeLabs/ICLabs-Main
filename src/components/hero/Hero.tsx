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
 * Hero — Curiosity.
 *
 * Desktop (immersive): a pinned scroll journey — the belief line, then the
 * beats swap in place — over a living layered scene (sky / figures / flora as
 * plain images, life via cheap CSS transforms: scene drift, figures breathing
 * from the ground up, grass swaying about its roots, a pulsing laptop glow).
 * No WebGL — the browser composites the PNGs pixel-true and nothing competes
 * with scrolling for the GPU. At the end the whole scene fades out IN PLACE,
 * dissolving into the site rather than scrolling away.
 *
 * Phone / iPad (still): no motion. A single quiet screen — the belief line
 * over the SAME fixed background the rest of the site uses (WorldBackground
 * paints the device-composed image behind everything), so the hero and the
 * page share one seamless backdrop.
 */
export function Hero({ beliefLine, subline, scrollBeats }: HeroProps) {
  const tier = useMotionTier()
  const isDesktop = useIsDesktop()
  const isPhone = useIsPhone()

  // the pinned journey + layered scene are a desktop, full-motion treat
  const immersive = tier === 'full' && isDesktop
  // phone + iPad share the site's fixed background; the hero adds no image
  const sharedBg = !isDesktop

  const wrapRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const beatRefs = useRef<Array<HTMLDivElement | null>>([])

  // the scroll journey — belief line, then the beats swap in place, then the
  // whole scene fades where it stands. Desktop/full-motion only.
  useEffect(() => {
    const wrap = wrapRef.current
    const sticky = stickyRef.current
    if (!wrap || !sticky || !immersive) return

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

        // the in-place farewell: over the last short stretch the whole sticky
        // scene fades where it stands, revealing the world stage behind — the
        // hero dissolves into the site instead of scrolling off
        const bye = gsap.utils.clamp(0, 1, (p - 0.94) / 0.06)
        sticky.style.opacity = `${1 - bye}`
      },
    })
    return () => st.kill()
  }, [immersive])

  // desktop-but-reduced-motion still needs an image (the site's desktop
  // backdrop is the sky, not the meadow); phone/iPad get it from WorldBackground
  const stillSrc = '/assets/hero/hero-static.webp'
  const sceneAlt =
    'A painter at an easel and a developer at a glowing laptop, at work together in a sunlit wildflower meadow.'

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      id="top"
      style={!immersive ? { height: '100svh' } : undefined}
    >
      <div ref={stickyRef} className={styles.sticky}>
        {immersive ? (
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
        ) : sharedBg ? (
          /* phone / iPad — no image here; the shared fixed background shows through */
          <div className={styles.sharedScene} role="img" aria-label={sceneAlt} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={stillSrc} alt={sceneAlt} className={styles.staticScene} fetchPriority="high" />
        )}
        <div className={styles.grade} aria-hidden />

        {/* separation layer — a soft paper light behind the text so the ink
            never merges with a dark patch of the scene (figures, laptop) */}
        <div className={`${styles.textScrim} ${sharedBg ? styles.textScrimStrong : ''}`} aria-hidden />

        <div ref={introRef} className={styles.intro}>
          <h1 className={styles.belief}>{formatBelief(beliefLine)}</h1>
          <p className={styles.subline}>{subline}</p>
          {immersive && (
            <span className={`mono-label ${styles.scrollHint}`} aria-hidden>
              scroll
            </span>
          )}
        </div>

        {/* the beat journey is desktop-only; phone/iPad/reduced-motion get the
            single still screen and the narrative continues in Problem */}
        {immersive &&
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
