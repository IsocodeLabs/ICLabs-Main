import type { CSSProperties, ReactNode } from 'react'

type FloraConfig = { side?: 'both' | 'left' | 'right'; flip?: boolean; scale?: number; opacity?: number }

type SectionProps = {
  id?: string
  /** which side the guiding trail weaves to at this section */
  trail?: 'left' | 'right' | 'center'
  /** kept for call-site compatibility; flora is now a fixed WorldBackground
   *  layer (pinned to the viewport bottom), so sections no longer render it */
  flora?: FloraConfig | false
  /** reverse register — ink base for dark sections (footer, dark cards) */
  reverse?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/**
 * A section in the one painterly world: transparent over the fixed sky + flora
 * stage, declaring its trail anchor. Content sits in glass panels (provided by
 * each section) so it stays legible over the sky.
 */
export function Section({ id, trail, reverse, className, style, children }: SectionProps) {
  return (
    <section
      id={id}
      data-trail={trail}
      className={`${reverse ? 'theme-ink' : 'theme-paper'} ${className ?? ''}`}
      style={{ position: 'relative', ...style }}
    >
      {children}
    </section>
  )
}
