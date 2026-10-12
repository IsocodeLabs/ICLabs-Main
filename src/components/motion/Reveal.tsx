'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { gsap } from '@/lib/gsap'
import { useMotionTier } from '@/lib/capability'

type RevealProps = {
  children: ReactNode
  /** delay in seconds, on top of the scroll trigger */
  delay?: number
  /** vertical travel in px */
  y?: number
  /** stagger children matching this selector instead of the wrapper */
  stagger?: string
  as?: 'div' | 'section' | 'span' | 'li'
  className?: string
  style?: CSSProperties
}

/**
 * Scroll-triggered reveal — the one considered thing at a time.
 * Calm rise + fade; instant at reduced motion.
 *
 * Fires from an IntersectionObserver (element top crosses 82% of the
 * viewport), not a pre-measured ScrollTrigger position: the hero changes
 * height after hydration on phones/tablets, which left measured positions
 * stale and panels low on the page stuck invisible. Observing real layout
 * can't go stale.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  stagger,
  as = 'div',
  className,
  style,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const tier = useMotionTier()

  useEffect(() => {
    const el = ref.current
    if (!el || tier === 'static') return

    const targets = stagger ? el.querySelectorAll(stagger) : el
    gsap.set(targets, { opacity: 0, y })

    let anim: gsap.core.Tween | null = null
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        anim = gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay,
          ease: 'power3.out',
          stagger: stagger ? 0.09 : 0,
          // once settled, drop the leftover inline transform: a resting
          // `transform` on a backdrop-filter panel is a known source of
          // half-painted text in Chromium
          clearProps: 'transform',
        })
      },
      // "top 82%": the element counts as arrived once its top is 18% up
      { rootMargin: '0px 0px -18% 0px', threshold: 0 },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      anim?.kill()
      // never leave a panel stranded invisible if the effect re-runs
      gsap.set(targets, { clearProps: 'opacity,transform' })
    }
  }, [tier, delay, y, stagger])

  // Rendered visible in SSR HTML (no-JS safe); the effect hides + reveals.
  const Tag = as as 'div'
  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  )
}
