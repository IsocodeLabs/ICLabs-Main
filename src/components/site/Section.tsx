import type { CSSProperties, ReactNode } from 'react'

type SectionProps = {
  id?: string
  /** paints the fixed background layer as this section takes over */
  bg: string
  theme: 'paper' | 'midnight'
  /** 0..1 — copper atmosphere intensity while this section holds */
  glow?: number
  /** which side the guiding trail weaves to at this section */
  trail?: 'left' | 'right' | 'center'
  className?: string
  children: ReactNode
}

/**
 * A spine section: transparent itself (the BackgroundConductor cross-fades
 * the canvas beneath), declaring its colours + trail anchor via data attrs.
 * At reduced motion (html.no-blend) it paints its own background.
 */
export function Section({ id, bg, theme, glow = 0, trail, className, children }: SectionProps) {
  return (
    <section
      id={id}
      data-bg={bg}
      data-glow={glow}
      data-trail={trail}
      className={`${theme === 'midnight' ? 'theme-midnight' : 'theme-paper'} ${className ?? ''}`}
      style={{ '--self-bg': bg, position: 'relative' } as CSSProperties}
    >
      {children}
    </section>
  )
}
