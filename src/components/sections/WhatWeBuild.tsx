import { Section } from '@/components/site/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import styles from './Sections.module.css'

type WhatWeBuildProps = {
  heading: string
  body: string[]
}

/**
 * What We Build — Understanding → Capability. Outcomes + feeling,
 * never a service menu. Content sits in a quiet glass panel over the sky.
 */
export function WhatWeBuild({ heading, body }: WhatWeBuildProps) {
  const [first, ...rest] = body
  return (
    <Section id="what-we-build" trail="right" flora={{ side: 'right', flip: true, scale: 0.95 }} className={styles.section}>
      <div className={styles.inner}>
        <Reveal className={styles.panel}>
          <div className={styles.eyebrowRow}>
            <Eyebrow>{heading}</Eyebrow>
          </div>
          <div className={styles.wwbGrid}>
            <h2 className={styles.heading} style={{ maxWidth: '24ch' }}>
              {first}
            </h2>
            <div className={`${styles.wwbAside} ${styles.stack16}`}>
              {rest.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
