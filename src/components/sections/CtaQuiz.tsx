import { Section } from '@/components/site/Section'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import styles from './Sections.module.css'

type CtaQuizProps = {
  heading: string
  body: string
  quizLabel: string
  hatchLabel: string
  contactEmail: string
  stepsLabel?: string
  steps?: Array<{ title: string; body: string }>
}

/**
 * CTA — Confidence → Action. One headline, one promise, one loud button; the
 * direct hatch stays beside it (the highest-intent buyers won't quiz). Under
 * it, what happens after you submit — the answer to "will anyone reply?".
 * A strong glass panel over the sky; the ink primary button is the loud note.
 */
export function CtaQuiz({
  heading,
  body,
  quizLabel,
  hatchLabel,
  contactEmail,
  stepsLabel,
  steps = [],
}: CtaQuizProps) {
  return (
    <Section id="work-with-us" trail="center" flora={{ side: 'both', scale: 1.08 }} className={styles.section}>
      <div className={styles.inner}>
        <Reveal className={`${styles.panel} ${styles.ctaWrap}`}>
          <h2 className={styles.heading} style={{ fontSize: 'var(--text-display-lg)', maxWidth: '16ch' }}>
            {heading}
          </h2>
          <p className={styles.ctaBody}>{body}</p>
          <div className={styles.ctaActions}>
            <Button href="/quiz" size="lg">
              {quizLabel}
            </Button>
            <Button href={`mailto:${contactEmail}`} variant="ghost" size="lg">
              {hatchLabel}
            </Button>
          </div>

          {steps.length > 0 && (
            <div className={styles.ctaSteps}>
              {stepsLabel && <span className={`mono-label ${styles.ctaStepsLabel}`}>{stepsLabel}</span>}
              <ol className={styles.ctaStepList}>
                {steps.map((s, i) => (
                  <li key={s.title} className={styles.ctaStep}>
                    <span className={`mono-label ${styles.ctaStepNum}`}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.ctaStepTitle}>{s.title}</span>
                    <span className={styles.ctaStepBody}>{s.body}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Reveal>
      </div>
    </Section>
  )
}
