import { Eyebrow } from '@/components/ui/Eyebrow'
import glass from '@/components/ui/Glass.module.css'
import { cardPayLine, type CareerRole, type CareersContent } from '@/lib/careers/content'
import { careersHref } from '@/lib/careers/urls'
import styles from './CareersApply.module.css'

const TYPE_LABEL: Record<string, string> = {
  intern: 'Internship',
  fullTime: 'Full-time',
  contract: 'Contract',
}

/**
 * Open Roles — open + paused named roles. Each card is deliberately short:
 * title, pay, a one-line fact row, and the apply link. The role's description
 * lives on its own page; the whole card links there (a stretched link) and
 * "Apply →" jumps straight to that page's form. Paused roles keep their card
 * with a badge so people know to check back.
 */
export function RoleCards({ page, roles }: { page: CareersContent['page']; roles: CareerRole[] }) {
  return (
    <section id="roles" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.blockHead}>
          <Eyebrow>{page.rolesEyebrow}</Eyebrow>
          <h2 className={styles.blockHeading}>{page.rolesHeading}</h2>
          <p className={styles.blockNote}>{page.rolesNote}</p>
        </div>

        {roles.length === 0 ? (
          <p className={styles.rolesEmpty}>{page.rolesEmpty}</p>
        ) : (
          <div className={styles.roleGrid}>
            {roles.map((r) => {
              const href = careersHref(`/roles/${r.slug}`)
              const paused = r.status === 'paused'
              const pay = cardPayLine(r)
              const facts = [TYPE_LABEL[r.type] ?? r.type, r.duration, r.location].filter(Boolean)
              return (
                <article
                  key={r.roleKey}
                  className={`${glass.glass} ${glass.dark} ${styles.roleCard} ${styles.roleCardLinked}`}
                >
                  <h3 className={styles.roleTitle}>
                    <a href={href} className={styles.roleCardLink}>
                      {r.title}
                    </a>
                  </h3>
                  {pay && <p className={styles.rolePay}>{pay}</p>}
                  <ul className={styles.roleFacts}>
                    {facts.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  {paused ? (
                    <span className={`mono-label ${styles.pausedBadge}`}>Applications paused</span>
                  ) : (
                    <a href={`${href}#apply`} className={styles.roleApply}>
                      Apply →
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
