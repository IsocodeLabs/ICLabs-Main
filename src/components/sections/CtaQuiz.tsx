import { Section } from '@/components/site/Section'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { QuoteRotator } from './QuoteRotator'
import styles from './Sections.module.css'

type CtaQuizProps = {
  heading: string
  body: string
  quizLabel: string
  hatchLabel: string
  contactEmail: string
  quotes: string[]
}

/**
 * CTA — Confidence → Action. Selectivity said plainly; the quiz is the door,
 * the direct hatch stays prominent (the highest-intent buyers won't quiz).
 * A strong glass panel over the sky; the ink primary button is the loud note.
 */
export function CtaQuiz({ heading, body, quizLabel, hatchLabel, contactEmail, quotes }: CtaQuizProps) {
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
          <QuoteRotator quotes={quotes} className={styles.ctaQuote} />
        </Reveal>
      </div>
    </Section>
  )
}
