import { Eyebrow } from '@/components/ui/Eyebrow'
import glass from '@/components/ui/Glass.module.css'
import type { CareerRole, CareersContent } from '@/lib/careers/content'
import { careersHref } from '@/lib/careers/urls'
import styles from './CareersApply.module.css'

/**
 * Open Roles — open + paused named roles. The whole card is one link to the
 * role's job page (a stretched link); there's no direct apply from a card, so
 * every applicant reads the role first. Paused roles keep their card with a
 * badge so people know to check back.
 */
export function RoleCards({ page, roles }: { page: CareersContent['page']; roles: CareerRole[] }) {
  return (
    <section id="roles" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.blockHead}>
          <Eyebrow>{page.rolesEyebrow}</Eyebrow>
          <h2 className={styles.blockHeading}>{page.rolesHeading}</h2>
          <p className={styles.blockNote}>{page.rolesNote}</p>
          <p className={styles.availability}>{page.availabilityNote}</p>
        </div>

        {roles.length === 0 ? (
          <p className={styles.rolesEmpty}>{page.rolesEmpty}</p>
        ) : (
          <div className={styles.roleGrid}>
            {roles.map((r) => (
              <article
                key={r.roleKey}
                className={`${glass.glass} ${glass.dark} ${styles.roleCard} ${styles.roleCardLinked}`}
              >
                <h3 className={styles.roleTitle}>
                  <a href={careersHref(`/roles/${r.slug}`)} className={styles.roleCardLink}>
                    {r.title}
                  </a>
                </h3>
                {r.eyebrow && <p className={styles.roleMeta}>{r.eyebrow}</p>}
                <p className={styles.roleBlurb}>{r.blurb}</p>
                {r.payLine && <p className={styles.rolePay}>{r.payLine}</p>}
                <div className={styles.roleFoot}>
                  <span className={styles.roleCta} aria-hidden>
                    {page.cardCta}
                  </span>
                  {r.status === 'paused' && (
                    <span className={`mono-label ${styles.pausedBadge}`}>{page.pausedBadge}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
