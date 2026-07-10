import Image from 'next/image'
import { WorldBackground } from '@/components/motion/WorldBackground'
import { Section } from '@/components/site/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { AboutContact } from '@/components/sections/AboutContact'
import { Footer } from '@/components/site/Footer'
import type { AboutPageContent } from '@/lib/content'
import glass from '@/components/ui/Glass.module.css'
import sections from '@/components/sections/Sections.module.css'
import styles from './AboutPage.module.css'

type FooterContent = {
  beliefLine: string
  navLinks: Array<{ label: string; href: string }>
  legalLinks: Array<{ label: string; href: string }>
  copyright: string
}

/**
 * The standalone /about page. A content page, not the homepage journey: the
 * anchor world drifts ambiently behind (WorldBackground), content floats on
 * quiet glass. No pinned hero, no scroll beats, no trail spine — those stay
 * homepage-only (design-system experience rules).
 */
export function AboutPage({
  content,
  footer,
}: {
  content: AboutPageContent
  footer: FooterContent
}) {
  const { page, values, founders } = content

  return (
    <>
      <WorldBackground />
      <div style={{ position: 'relative' }}>
        <main className={styles.page}>
          {/* ── Intro ── */}
          <Section className={`${sections.section} ${styles.introSection}`}>
            <div className={sections.inner}>
              <Reveal className={`${glass.glass} ${glass.strong} ${styles.introPanel}`}>
                <Eyebrow>{page.eyebrow}</Eyebrow>
                <h1 className={styles.title}>{page.heading}</h1>
                <div className={styles.introBody}>
                  {page.intro.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </Reveal>
            </div>
          </Section>

          {/* ── Values ── */}
          <Section className={sections.section}>
            <div className={sections.inner}>
              <Reveal className={styles.blockHead}>
                <Eyebrow>{page.valuesEyebrow}</Eyebrow>
                <h2 className={styles.blockHeading}>{page.valuesHeading}</h2>
              </Reveal>
              <Reveal stagger="[data-value]" className={styles.valuesGrid}>
                {values.map((v) => (
                  <div key={v.title} data-value className={`${glass.glass} ${styles.valueCard}`}>
                    <span className={styles.valueTitle}>{v.title}</span>
                    <span className={styles.valueDesc}>{v.description}</span>
                  </div>
                ))}
              </Reveal>
            </div>
          </Section>

          {/* ── Founders ── */}
          <Section trail="center" className={sections.section}>
            <div className={sections.inner}>
              <Reveal className={styles.blockHead}>
                <Eyebrow>{page.foundersEyebrow}</Eyebrow>
                <h2 className={styles.blockHeading}>{page.foundersHeading}</h2>
                <p className={styles.blockIntro}>{page.foundersIntro}</p>
              </Reveal>
              <Reveal stagger="[data-founder]" className={styles.foundersGrid}>
                {founders.map((f) => (
                  <article key={f.name} data-founder className={`${glass.glass} ${styles.founderCard}`}>
                    <div className={styles.founderPhoto}>
                      <Image
                        src={f.photo}
                        alt={f.name}
                        width={1000}
                        height={1000}
                        className={styles.founderImg}
                        sizes="(max-width: 720px) 90vw, 460px"
                      />
                    </div>
                    <div className={styles.founderMeta}>
                      <h3 className={styles.founderName}>{f.name}</h3>
                      <span className={`mono-label ${styles.founderTitle}`}>{f.title}</span>
                      {f.eduLine && <p className={styles.founderEdu}>{f.eduLine}</p>}
                      {f.socials.length > 0 && (
                        <div className={styles.founderSocials}>
                          {f.socials.map((s) => (
                            <a
                              key={s.platform + s.url}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${f.name} on ${s.platform}`}
                              className={styles.socialLink}
                            >
                              <SocialIcon platform={s.platform} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </Reveal>
            </div>
          </Section>

          {/* ── Contact close ── */}
          <Section id="contact" className={`${sections.section} ${sections.tailRoom}`}>
            <div className={sections.inner}>
              <Reveal className={`${glass.glass} ${glass.strong} ${styles.contactPanel}`}>
                <h2 className={styles.contactHeading}>{page.contactHeading}</h2>
                <p className={styles.contactBody}>{page.contactBody}</p>
                <AboutContact />
              </Reveal>
            </div>
          </Section>
        </main>

        <Footer
          beliefLine={footer.beliefLine}
          navLinks={footer.navLinks}
          legalLinks={footer.legalLinks}
          copyright={footer.copyright}
        />
      </div>
    </>
  )
}

function SocialIcon({ platform }: { platform: string }) {
  if (platform === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
        <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21h-4V9Z" />
      </svg>
    )
  }
  // github / x fall back to a neutral dot until those platforms are used
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}
