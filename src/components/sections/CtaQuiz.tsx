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
 */
export function CtaQuiz({ heading, body, quizLabel, hatchLabel, contactEmail, quotes }: CtaQuizProps) {
  return (
    <Section id="work-with-us" bg="#12161C" theme="midnight" glow={1} trail="center" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.ctaWrap}>
          <Reveal>
            <h2 className={styles.displayLg} style={{ maxWidth: '16ch' }}>
              {heading}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className={styles.ctaBody}>{body}</p>
          </Reveal>
          <Reveal delay={0.16} className={styles.ctaActions}>
            <Button href="/quiz" size="lg">
              {quizLabel}
            </Button>
            <Button href={`mailto:${contactEmail}`} variant="ghost" size="lg">
              {hatchLabel}
            </Button>
          </Reveal>
          <QuoteRotator quotes={quotes} className={styles.ctaQuote} />
        </div>
      </div>
    </Section>
  )
}
