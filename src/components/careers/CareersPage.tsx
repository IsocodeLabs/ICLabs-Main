import { CareersWorld } from '@/components/motion/CareersWorld'
import { CareersNav } from './CareersNav'
import { CareersApply } from './CareersApply'
import { Eyebrow } from '@/components/ui/Eyebrow'
import glass from '@/components/ui/Glass.module.css'
import type { CareersContent } from '@/lib/content'
import styles from './CareersPage.module.css'

/**
 * Careers — the dark atelier world. Content page (no scroll journey): the world
 * sways behind, copy sits on white / dark glass. Hero → the bar → open roles →
 * apply → quiet close. Roles + form are the one interactive island (CareersApply).
 */
export function CareersPage({ content }: { content: CareersContent }) {
  const { page, roles, form } = content

  return (
    <div className={`theme-ink ${styles.page}`}>
      <CareersWorld />
      <CareersNav />

      <main id="top">
        {/* ── Hero band ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <Eyebrow>{page.eyebrow}</Eyebrow>
            <h1 className={styles.heroHeading}>{page.heading}</h1>
            <p className={styles.heroPitch}>{page.pitch}</p>
            <a href="#roles" className={styles.heroCta}>
              See open roles →
            </a>
          </div>
        </section>

        {/* ── The bar ── */}
        <section className={styles.section}>
          <div className={styles.inner}>
            <div className={styles.blockHead}>
              <Eyebrow>{page.barEyebrow}</Eyebrow>
              <h2 className={styles.blockHeading}>{page.barHeading}</h2>
            </div>
            <div className={styles.barBody}>
              {page.barBody.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className={styles.barGrid}>
              {page.barPoints.map((pt) => (
                <div key={pt.title} className={`${glass.glass} ${glass.dark} ${styles.barCard}`}>
                  <span className={styles.barCardTitle}>{pt.title}</span>
                  <span className={styles.barCardBody}>{pt.body}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Open roles + apply ── */}
        <CareersApply page={page} roles={roles} form={form} />

        {/* ── Quiet close ── */}
        <footer className={styles.close}>
          <div className={styles.inner}>
            <p className={styles.closeLine}>{page.closeLine}</p>
            <a href="#apply" className={styles.closeApply}>
              Send an open application →
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
