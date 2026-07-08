'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useIsDesktop, useMotionTier } from '@/lib/capability'

type Pt = { x: number; y: number }

/**
 * The guiding trail — the site's structural spine (desktop only).
 * A copper thread drawn from the hero to the footer, advancing with scroll,
 * weaving toward each section's anchor. Content mounts around it.
 * Dropped entirely on mobile / reduced motion / weak devices.
 */
export function TrailSpine() {
  const tier = useMotionTier()
  const isDesktop = useIsDesktop()
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const cometRef = useRef<SVGCircleElement>(null)
  const [geom, setGeom] = useState<{ w: number; h: number; d: string } | null>(null)

  const enabled = tier === 'full' && isDesktop

  // Build the path from section anchors once layout settles (and on resize).
  useEffect(() => {
    if (!enabled) {
      setGeom(null)
      return
    }

    let raf = 0
    const build = () => {
      const anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-trail]'))
      if (anchors.length < 2) return
      const w = document.documentElement.clientWidth
      const h = document.documentElement.scrollHeight
      const pts: Pt[] = anchors.map((el) => {
        const rect = el.getBoundingClientRect()
        const top = rect.top + window.scrollY
        const side = el.dataset.trail
        const x =
          side === 'left' ? w * 0.12 : side === 'right' ? w * 0.88 : w * 0.5
        return { x, y: top + rect.height * 0.35 }
      })
      // gentle S-curve through the anchors (catmull-rom → cubic bezier)
      let d = `M ${pts[0].x} ${pts[0].y}`
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)]
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const p3 = pts[Math.min(pts.length - 1, i + 2)]
        const c1x = p1.x + (p2.x - p0.x) / 6
        const c1y = p1.y + (p2.y - p0.y) / 6
        const c2x = p2.x - (p3.x - p1.x) / 6
        const c2y = p2.y - (p3.y - p1.y) / 6
        d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
      }
      setGeom({ w, h, d })
    }

    // wait for fonts/images to settle layout, then build; rebuild on resize
    const start = () => {
      raf = requestAnimationFrame(build)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(build)
    })
    ro.observe(document.body)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('load', start)
      ro.disconnect()
    }
  }, [enabled])

  // Advance the trail with scroll.
  useEffect(() => {
    const path = pathRef.current
    const comet = cometRef.current
    if (!geom || !path || !comet) return

    const length = path.getTotalLength()
    path.style.strokeDasharray = `${length}`
    path.style.strokeDashoffset = `${length}`

    const state = { p: 0 }
    const tween = gsap.to(state, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
      },
      onUpdate: () => {
        const at = state.p * length
        path.style.strokeDashoffset = `${length - at}`
        const pt = path.getPointAtLength(at)
        comet.setAttribute('cx', `${pt.x}`)
        comet.setAttribute('cy', `${pt.y}`)
        comet.style.opacity = state.p > 0.005 && state.p < 0.998 ? '1' : '0'
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [geom])

  if (!enabled || !geom) return null

  return (
    <svg
      ref={svgRef}
      aria-hidden
      width={geom.w}
      height={geom.h}
      viewBox={`0 0 ${geom.w} ${geom.h}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        <linearGradient id="trail-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CE9463" />
          <stop offset="0.5" stopColor="#B06A3B" />
          <stop offset="1" stopColor="#7E4A28" />
        </linearGradient>
        <filter id="trail-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <path
        ref={pathRef}
        d={geom.d}
        fill="none"
        stroke="url(#trail-metal)"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle ref={cometRef} r="7" fill="rgba(206,148,99,0.5)" filter="url(#trail-glow)" opacity="0" />
    </svg>
  )
}
