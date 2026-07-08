import { Section } from '@/components/site/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { AboutContact } from './AboutContact'
import styles from './Sections.module.css'

type AboutProps = {
  heading: string
  body: string[]
  teamLine: string
  contactHeading: string
  values: Array<{ title: string; description: string }>
}

/**
 * About — values + the quiet team line + "talk to our team".
 * No names, no photos; the values carry it.
 */
export function About({ heading, body, teamLine, contactHeading, values }: AboutProps) {
  return (
    <Section
      id="about"
      bg="#F4EFE6"
      theme="paper"
      glow={0.15}
      trail="right"
      className={`${styles.section} ${styles.tailRoom}`}
    >
      <div className={styles.inner}>
        <Reveal className={styles.eyebrowRow}>
          <Eyebrow>{heading}</Eyebrow>
        </Reveal>

        <div className={styles.aboutGrid}>
          <div>
            <Reveal className={styles.stack24}>
              {body.map((p, i) =>
                i === 0 ? (
                  <h2 key={i} className={styles.displayMd} style={{ maxWidth: '18ch' }}>
                    {p}
                  </h2>
                ) : (
                  <p key={i} className={styles.leadMuted} style={{ maxWidth: '46ch' }}>
                    {p}
                  </p>
                ),
              )}
            </Reveal>
            <Reveal delay={0.1}>
              <p className={`mono-label ${styles.teamLine}`}>{teamLine}</p>
            </Reveal>
          </div>

          <div>
            <Reveal stagger="[data-value]" as="div">
              <ul className={styles.valuesList}>
                {values.map((v) => (
                  <li key={v.title} data-value className={styles.valueItem}>
                    <span className={styles.valueTitle}>{v.title}</span>
                    <span className={styles.valueDesc}>{v.description}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.1}>
              <div id="contact" style={{ marginTop: 'var(--sp-64)' }}>
                <h3 className={styles.displayMd} style={{ fontSize: 'var(--fs-28)', marginBottom: 'var(--sp-24)' }}>
                  {contactHeading}
                </h3>
                <AboutContact />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  )
}
