'use client'

import { useEffect, useState } from 'react'
import { useMotionTier } from '@/lib/capability'

/** The rotating values-quote — quiet and confident. Static at reduced motion. */
export function QuoteRotator({ quotes, className }: { quotes: string[]; className?: string }) {
  const tier = useMotionTier()
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (tier === 'static' || quotes.length < 2) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length)
        setVisible(true)
      }, 500)
    }, 5200)
    return () => clearInterval(interval)
  }, [tier, quotes.length])

  if (quotes.length === 0) return null

  return (
    <p
      className={className}
      aria-live="off"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 480ms var(--ease-out)',
      }}
    >
      {quotes[index]}
    </p>
  )
}
