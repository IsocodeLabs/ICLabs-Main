import glass from '@/components/ui/Glass.module.css'
import type { CareersContent } from '@/lib/careers/content'
import styles from './CareersApply.module.css'

/**
 * The always-open application — its own section right after the role cards.
 * Quieter than a role card (lighter panel, no meta row) but not a footnote.
 * The CTA jumps to the main page form, which is the open application.
 */
export function OpenApplication({ page }: { page: CareersContent['page'] }) {
  return (
    <section id="open-application" className={styles.sectionTight}>
      <div className={styles.inner}>
        <div className={`${glass.glass} ${glass.dark} ${styles.openPanel}`}>
          <div className={styles.openCopy}>
            <h3 className={styles.openHeading}>{page.openHeading}</h3>
            <p className={styles.openBody}>{page.openBody}</p>
          </div>
          <a href="#apply" className={styles.openCta}>
            {page.openCta}
          </a>
        </div>
      </div>
    </section>
  )
}
