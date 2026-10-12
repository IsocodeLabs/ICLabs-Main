'use client'

import { Eyebrow } from '@/components/ui/Eyebrow'
import glass from '@/components/ui/Glass.module.css'
import type { CareersContent } from '@/lib/careers/content'
import { useCareersRole } from './CareersRoleContext'
import styles from './CareersApply.module.css'

/**
 * The always-open application — its own section right after the role cards.
 * Quieter than a role card (lighter panel, no meta row) but not a footnote.
 * The CTA preselects "Open application" in the form below and scrolls to it.
 */
export function OpenApplication({
  page,
  roleKey,
}: {
  page: CareersContent['page']
  roleKey: string
}) {
  const { chooseRole } = useCareersRole()

  return (
    <section id="open-application" className={styles.sectionTight}>
      <div className={styles.inner}>
        <div className={`${glass.glass} ${glass.dark} ${styles.openPanel}`}>
          <div className={styles.openCopy}>
            <Eyebrow>{page.openEyebrow}</Eyebrow>
            <h2 className={styles.openHeading}>{page.openHeading}</h2>
            <p className={styles.openBody}>{page.openBody}</p>
          </div>
          <a
            href="#apply"
            className={styles.openCta}
            onClick={(e) => {
              e.preventDefault()
              chooseRole(roleKey)
            }}
          >
            {page.openCta}
          </a>
        </div>
      </div>
    </section>
  )
}
