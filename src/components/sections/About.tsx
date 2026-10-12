import { Section } from '@/components/site/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { AboutContact } from './AboutContact'
import styles from './Sections.module.css'

type AboutProps = {
  heading: string
  body: string[]
  teamLine: string
  contactHeading: string
}

/**
 * About — one line of who, one line of how, then the small way in for a
 * question. The values live on /about; this is the teaser.
 */
export function About({ heading, body, teamLine, contactHeading }: AboutProps) {
  return (
    <Section
      id="about"
      trail="right"
      flora={{ side: 'both', scale: 1 }}
      className={`${styles.section} ${styles.tailRoom}`}
    >
      <div className={styles.inner}>
        <Reveal className={styles.panel}>
          <div className={styles.eyebrowRow}>
            <Eyebrow>{heading}</Eyebrow>
          </div>

          <div className={styles.aboutGrid}>
            <div>
              <div className={styles.stack24}>
                {body.map((p, i) =>
                  i === 0 ? (
                    <h2 key={i} className={styles.heading} style={{ maxWidth: '18ch' }}>
                      {p}
                    </h2>
                  ) : (
                    <p key={i} className={styles.leadMuted} style={{ maxWidth: '46ch' }}>
                      {p}
                    </p>
                  ),
                )}
              </div>
              {teamLine && <p className={styles.teamLine}>{teamLine}</p>}
              <div style={{ marginTop: 'var(--sp-24)' }}>
                <Button href="/about" variant="ghost" size="sm">
                  More about the studio →
                </Button>
              </div>
            </div>

            <div id="contact">
              <h3
                className={styles.heading}
                style={{ fontSize: 'var(--fs-28)', marginBottom: 'var(--sp-24)' }}
              >
                {contactHeading}
              </h3>
              <AboutContact />
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
