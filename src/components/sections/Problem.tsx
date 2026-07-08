import { Section } from '@/components/site/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { Squircle } from '@/components/ui/Squircle'
import glass from '@/components/ui/Glass.module.css'
import styles from './Sections.module.css'

type Stat = { value: string; label: string; source: string; sourceNote: string }

type ProblemProps = {
  narrative: string[]
  stats: Stat[]
}

/**
 * Problem — Context. Their pain, quantified; no service pitch.
 * Descends into Midnight: the first copper-against-dark moment.
 */
export function Problem({ narrative, stats }: ProblemProps) {
  return (
    <Section id="problem" bg="#12161C" theme="midnight" glow={0.9} trail="left" className={styles.section}>
      <div className={styles.inner}>
        <Reveal className={styles.eyebrowRow}>
          <Eyebrow>The problem</Eyebrow>
        </Reveal>

        <div className={styles.problemNarrative}>
          {narrative.map((p, i) => (
            <Reveal key={i} as="div" delay={i * 0.05}>
              <p>{p}</p>
            </Reveal>
          ))}
        </div>

        <Reveal stagger="[data-stat]" className={styles.statsBand}>
          {stats.map((s) => (
            <div key={s.value + s.source} data-stat className={styles.productCardShadow}>
              <Squircle radius={16} className={`${glass.glass} ${glass.dark} ${styles.statCard}`}>
                <span className={`${styles.statValue} copper-text`}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
                <cite className={`mono-label ${styles.statSource}`} title={s.sourceNote}>
                  — {s.source}
                </cite>
              </Squircle>
            </div>
          ))}
        </Reveal>
      </div>
    </Section>
  )
}
