'use client'

import type { CareerRole, CareersContent } from '@/lib/content'
import { Eyebrow } from '@/components/ui/Eyebrow'
import glass from '@/components/ui/Glass.module.css'
import { useCareersRole } from './CareersRoleContext'
import styles from './CareersApply.module.css'

const TYPE_LABEL: Record<string, string> = {
  intern: 'Internship',
  fullTime: 'Full-time',
  contract: 'Contract',
}

/**
 * Open Roles — the named positions only. The evergreen "open application"
 * entry doesn't get a card here (its CTA would just duplicate the one in the
 * quiet close footer and the role dropdown in the form already offers it);
 * it still exists as a real JobOpenings row so the form's role select and the
 * close footer's link both resolve to it.
 */
export function CareersRoles({
  page,
  roles,
}: {
  page: CareersContent['page']
  roles: CareerRole[]
}) {
  const { chooseRole } = useCareersRole()
  const namedRoles = roles.filter((r) => !r.openApplication)

  return (
    <section id="roles" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.blockHead}>
          <Eyebrow>{page.rolesEyebrow}</Eyebrow>
          <h2 className={styles.blockHeading}>{page.rolesHeading}</h2>
          <p className={styles.blockNote}>{page.rolesNote}</p>
        </div>

        <div className={styles.roleGrid}>
          {namedRoles.map((r) => (
            <article key={r.roleKey} className={`${glass.glass} ${glass.dark} ${styles.roleCard}`}>
              <div className={styles.roleTop}>
                <h3 className={styles.roleTitle}>{r.title}</h3>
                <span className={`mono-label ${styles.roleType}`}>{TYPE_LABEL[r.type] ?? r.type}</span>
              </div>
              <p className={styles.roleMeta}>{[r.dept, r.location].filter(Boolean).join('  ·  ')}</p>
              <p className={styles.roleBlurb}>{r.blurb}</p>
              <button type="button" className={styles.roleApply} onClick={() => chooseRole(r.roleKey)}>
                Apply →
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
