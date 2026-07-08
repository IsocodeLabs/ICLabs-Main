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
 * never a service menu. Rises back to Paper: "the other kind."
 */
export function WhatWeBuild({ heading, body }: WhatWeBuildProps) {
  const [first, ...rest] = body
  return (
    <Section id="what-we-build" bg="#F4EFE6" theme="paper" glow={0.25} trail="right" className={styles.section}>
      <div className={styles.inner}>
        <Reveal className={styles.eyebrowRow}>
          <Eyebrow>{heading}</Eyebrow>
        </Reveal>

        <div className={styles.wwbGrid}>
          <Reveal>
            <h2 className={styles.displayMd} style={{ maxWidth: '24ch' }}>
              {first}
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <div className={`${styles.wwbAside} ${styles.stack16}`}>
              {rest.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  )
}
