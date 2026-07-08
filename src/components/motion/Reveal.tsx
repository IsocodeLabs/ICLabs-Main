'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
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
    const anim = gsap.fromTo(
      targets,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        stagger: stagger ? 0.09 : 0,
        scrollTrigger: {
          trigger: el,
          start: 'top 82%',
          once: true,
        },
      },
    )

    return () => {
      anim.scrollTrigger?.kill()
      anim.kill()
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
