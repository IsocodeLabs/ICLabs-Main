'use client'

import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useMotionTier } from '@/lib/capability'

/**
 * Gentle smooth scroll (never scroll-jacking), wired into GSAP's ticker so
 * ScrollTrigger and Lenis share one clock. Skipped entirely at reduced motion.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const tier = useMotionTier()

  // Always land at the top on load — the page is tall + pinned, and browser
  // scroll-restoration otherwise drops you mid-page (or at the very end) before
  // ScrollTrigger has measured, which also freezes the scroll-driven motion.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (tier === 'static') return

    // One smoothing pass, done well: Lenis eases the scroll position and every
    // ScrollTrigger below reads *that* eased value with scrub:true — so motion
    // is smooth (Lenis) and frame-locked to the scroll (scrub), never floaty.
    // lerp 0.1 is the buttery glide; 0.24 tracked so tightly it read as abrupt/
    // rough on a trackpad. Don't add a numeric scrub on top — that double-eases.
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })

    lenis.scrollTo(0, { immediate: true })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // re-measure once fonts/images settle so pinned triggers start correct
    const refresh = () => ScrollTrigger.refresh()
    if (document.readyState === 'complete') refresh()
    else window.addEventListener('load', refresh, { once: true })

    return () => {
      window.removeEventListener('load', refresh)
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [tier])

  return <>{children}</>
}
