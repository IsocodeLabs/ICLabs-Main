import type { CSSProperties, ReactNode } from 'react'
import { FloraEdge } from './FloraEdge'

type FloraConfig = { side?: 'both' | 'left' | 'right'; flip?: boolean; scale?: number; opacity?: number }

type SectionProps = {
  id?: string
  /** which side the guiding trail weaves to at this section */
  trail?: 'left' | 'right' | 'center'
  /** frame this section's bottom corners with swaying flora (code variety) */
  flora?: FloraConfig | false
  /** reverse register — ink base for dark sections (footer, dark cards) */
  reverse?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/**
 * A section in the one painterly world: transparent over the fixed sky plate,
 * optionally framed with edge flora, declaring its trail anchor. Content sits
 * in glass panels (provided by each section) so it stays legible over the sky.
 */
export function Section({ id, trail, flora, reverse, className, style, children }: SectionProps) {
  return (
    <section
      id={id}
      data-trail={trail}
      className={`${reverse ? 'theme-ink' : 'theme-paper'} ${className ?? ''}`}
      style={{ position: 'relative', ...style }}
    >
      {flora !== false && <FloraEdge {...(flora ?? {})} />}
      {children}
    </section>
  )
}
