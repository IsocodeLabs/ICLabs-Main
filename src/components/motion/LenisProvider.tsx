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

  useEffect(() => {
    if (tier === 'static') return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      touchMultiplier: 1.4,
    })

    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [tier])

  return <>{children}</>
}
