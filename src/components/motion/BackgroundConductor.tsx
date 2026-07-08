'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useMotionTier } from '@/lib/capability'

/**
 * The no-hard-boundaries system: one fixed layer behind everything,
 * cross-fading colour (and a copper atmosphere) as sections hand over.
 * Sections declare `data-bg` (colour) and optional `data-glow` (0..1).
 */
export function BackgroundConductor() {
  const bgRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const tier = useMotionTier()

  useEffect(() => {
    const bg = bgRef.current
    const glow = glowRef.current
    if (!bg || !glow) return

    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-bg]'))
    if (sections.length === 0) return

    bg.style.backgroundColor = sections[0].dataset.bg!
    glow.style.opacity = sections[0].dataset.glow ?? '0'

    if (tier === 'static') {
      // no blending — sections paint their own backgrounds via CSS fallback
      document.documentElement.classList.add('no-blend')
      return () => document.documentElement.classList.remove('no-blend')
    }

    const triggers: ScrollTrigger[] = []
    for (let i = 1; i < sections.length; i++) {
      const prev = sections[i - 1].dataset
      const curr = sections[i].dataset
      const tween = gsap.fromTo(
        bg,
        { backgroundColor: prev.bg },
        {
          backgroundColor: curr.bg,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: {
            trigger: sections[i],
            start: 'top 72%',
            end: 'top 22%',
            scrub: true,
          },
        },
      )
      const glowTween = gsap.fromTo(
        glow,
        { opacity: parseFloat(prev.glow ?? '0') },
        {
          opacity: parseFloat(curr.glow ?? '0'),
          ease: 'none',
          immediateRender: false,
          scrollTrigger: {
            trigger: sections[i],
            start: 'top 72%',
            end: 'top 22%',
            scrub: true,
          },
        },
      )
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger)
      if (glowTween.scrollTrigger) triggers.push(glowTween.scrollTrigger)
    }

    return () => triggers.forEach((t) => t.kill())
  }, [tier])

  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -2 }}>
      <div ref={bgRef} style={{ position: 'absolute', inset: 0 }} />
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          background:
            'radial-gradient(60% 50% at 72% 30%, rgba(206,148,99,0.16), transparent 70%),' +
            'radial-gradient(45% 40% at 20% 75%, rgba(176,106,59,0.10), transparent 70%)',
        }}
      />
    </div>
  )
}
