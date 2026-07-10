import { Section } from '@/components/site/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import glass from '@/components/ui/Glass.module.css'
import styles from './Sections.module.css'

type Stat = { value: string; label: string; source: string; sourceNote: string }

type ProblemProps = {
  narrative: string[]
  stats: Stat[]
}

/**
 * Problem — Context. Their pain, quantified; no service pitch. The narrative
 * sits in a quiet glass panel over the sky; the stats read as a proof row.
 */
export function Problem({ narrative, stats }: ProblemProps) {
  return (
    <Section id="problem" trail="left" flora={{ side: 'left', scale: 1.05 }} className={`${styles.section} ${styles.afterHero}`}>
      <div className={styles.inner}>
        <Reveal className={styles.panel}>
          <div className={styles.eyebrowRow}>
            <Eyebrow>The problem</Eyebrow>
          </div>
          <div className={styles.problemNarrative}>
            {narrative.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>

        <Reveal stagger="[data-stat]" className={styles.statsBand}>
          {stats.map((s) => (
            <div key={s.value + s.source} data-stat className={`${glass.glass} ${styles.statCard}`}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
              <cite className={`mono-label ${styles.statSource}`} title={s.sourceNote}>
                — {s.source}
              </cite>
            </div>
          ))}
        </Reveal>
      </div>
    </Section>
  )
}
