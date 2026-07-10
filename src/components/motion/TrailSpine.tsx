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

  // Advance the trail with scroll. The head is glued to the VIEWPORT CENTRE at
  // all times: rather than mapping scroll fraction → arc-length (which drifts,
  // because the weaving path adds length unevenly), we find the point on the
  // path whose document-Y sits at scrollY + half a viewport, and reveal the
  // stroke up to exactly there. So on screen the head holds dead-centre while
  // the drawn line grows behind it.
  useEffect(() => {
    const path = pathRef.current
    const comet = cometRef.current
    if (!geom || !path || !comet) return

    const length = path.getTotalLength()
    path.style.strokeDasharray = `${length}`
    path.style.strokeDashoffset = `${length}`

    // Sample the curve ONCE into a lookup table (y is monotonic top→bottom).
    // Per scroll frame it's then a pure array binary-search + lerp — zero
    // geometry calls, so the trail costs nothing while scrolling.
    const N = 600
    const xs = new Float32Array(N + 1)
    const ys = new Float32Array(N + 1)
    for (let i = 0; i <= N; i++) {
      const pt = path.getPointAtLength((length * i) / N)
      xs[i] = pt.x
      ys[i] = pt.y
    }

    const update = () => {
      const targetY = window.scrollY + window.innerHeight * 0.5
      let lo = 0
      let hi = N
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (ys[mid] < targetY) lo = mid
        else hi = mid
      }
      const span = ys[hi] - ys[lo]
      const t = gsap.utils.clamp(0, 1, span > 0 ? (targetY - ys[lo]) / span : 0)
      const frac = (lo + t) / N
      path.style.strokeDashoffset = `${length * (1 - frac)}`
      comet.setAttribute('cx', `${xs[lo] + (xs[hi] - xs[lo]) * t}`)
      comet.setAttribute('cy', `${ys[lo] + (ys[hi] - ys[lo]) * t}`)
      comet.style.opacity = frac > 0.01 && frac < 0.99 ? '1' : '0'
    }

    // scrub:true → fires every scroll frame reading live scrollY, so the head
    // tracks the centre with no smoothing lag of its own
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: update,
    })
    update()

    return () => st.kill()
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
        <filter id="trail-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <path
        ref={pathRef}
        d={geom.d}
        fill="none"
        stroke="#141210"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.32"
      />
      <circle ref={cometRef} r="5" fill="rgba(20,18,16,0.4)" filter="url(#trail-glow)" opacity="0" />
    </svg>
  )
}
