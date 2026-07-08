'use client'

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import { squirclePath } from '@/lib/squircle'

type SquircleProps = {
  radius?: number
  as?: ElementType
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * G2 continuous-curvature surface. Renders with plain border-radius until
 * measured, then swaps in the superellipse clip-path (felt, not seen).
 * Shadows go on a parent via --e*-drop filters (box-shadow won't follow a clip).
 */
export function Squircle({
  radius = 24,
  as: Tag = 'div',
  className,
  style,
  children,
}: SquircleProps) {
  const ref = useRef<HTMLElement>(null)
  const [path, setPath] = useState('')

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      // border-box, not contentRect — the clip applies to the full box
      const box = entry.borderBoxSize?.[0]
      const width = box ? box.inlineSize : el.getBoundingClientRect().width
      const height = box ? box.blockSize : el.getBoundingClientRect().height
      setPath(squirclePath(Math.round(width), Math.round(height), radius))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [radius])

  const Comp = Tag as 'div'
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      style={{
        borderRadius: path ? 0 : radius,
        clipPath: path ? `path('${path}')` : undefined,
        ...style,
      }}
    >
      {children}
    </Comp>
  )
}
