import { CareersWorld } from '@/components/motion/CareersWorld'
import { CareersNav } from './CareersNav'
import { RoleCards } from './RoleCards'
import { OpenApplication } from './OpenApplication'
import { ApplyForm } from './ApplyForm'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { openApplicationRole, visibleRoleCards, type CareersContent } from '@/lib/careers/content'
import styles from './CareersPage.module.css'

/**
 * Careers — the dark atelier world. Content page (no scroll journey): the world
 * sways behind, copy sits on dark glass.
 *
 * Order: Hero → Open Roles → Open Application → The Bar → Apply. Every role card
 * opens its job page, where that role's application lives (PRD v3). The form
 * here is the open application only, and stays live even when every named role
 * is paused or closed.
 */
export function CareersPage({ content }: { content: CareersContent }) {
  const { page, roles } = content
  const cards = visibleRoleCards(roles)
  const openApp = openApplicationRole(roles)

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
              {page.heroCta}
            </a>
          </div>
        </section>

        {/* ── Open roles ── */}
        <RoleCards page={page} roles={cards} />

        {/* ── Open application ── */}
        {openApp && <OpenApplication page={page} />}

        {/* ── The bar ── */}
        <section className={styles.section}>
          <div className={styles.inner}>
            <div className={styles.blockHead}>
              <Eyebrow>{page.barEyebrow}</Eyebrow>
              <h2 className={styles.blockHeading}>{page.barHeading}</h2>
            </div>
            <p className={styles.barIntro}>{page.barIntro}</p>
          </div>
        </section>

        {/* ── Apply: open application only ── */}
        {openApp && <ApplyForm role={openApp} copy={page.openForm} />}
        <div className={styles.closeSpacer} aria-hidden />
      </main>
    </div>
  )
}
