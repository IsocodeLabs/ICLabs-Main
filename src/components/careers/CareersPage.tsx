import { CareersWorld } from '@/components/motion/CareersWorld'
import { CareersNav } from './CareersNav'
import { CareersRoleProvider } from './CareersRoleContext'
import { RoleCards } from './RoleCards'
import { OpenApplication } from './OpenApplication'
import { ApplyForm } from './ApplyForm'
import { careersConfig } from '@/lib/careers/config'
import { Eyebrow } from '@/components/ui/Eyebrow'
import glass from '@/components/ui/Glass.module.css'
import { applyableRoles, visibleRoleCards, type CareersContent } from '@/lib/careers/content'
import styles from './CareersPage.module.css'

/**
 * Careers — the dark atelier world. Content page (no scroll journey): the world
 * sways behind, copy sits on dark glass.
 *
 * Order: Hero → Open Roles → Open Application → The Bar → Apply. Role cards link
 * to their own /roles/<slug> pages (each with the form, role locked); the main
 * page's form covers every open role plus the open application, which stays
 * live even when every named role is paused or closed.
 */
export function CareersPage({ content }: { content: CareersContent }) {
  const { page, roles, formIntro } = content
  const cards = visibleRoleCards(roles)
  const formRoles = applyableRoles(roles)
  const openApp = roles.find((r) => r.roleKind === 'open' && r.status === 'open')

  return (
    <div className={`theme-ink ${styles.page}`}>
      <CareersWorld />
      <CareersNav />

      <CareersRoleProvider defaultRole={formRoles[0]?.roleKey ?? ''}>
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

          {/* ── Open roles ── */}
          <RoleCards page={page} roles={cards} />

          {/* ── Open application ── */}
          {openApp && <OpenApplication page={page} roleKey={openApp.roleKey} />}

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

          {/* ── Apply ── */}
          {formRoles.length > 0 && (
            <ApplyForm page={page} roles={formRoles} intro={formIntro} humanCheck={careersConfig.humanCheck} />
          )}
          <div className={styles.closeSpacer} aria-hidden />
        </main>
      </CareersRoleProvider>
    </div>
  )
}
