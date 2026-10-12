import Image from 'next/image'
import glass from '@/components/ui/Glass.module.css'
import { careersHref } from '@/lib/careers/urls'
import styles from './CareersNav.module.css'
import monogram from '../../../public/assets/brand/il-monogram-white.png'

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://isocodelabs.com'

/**
 * Careers' own minimal chrome — white monogram on dark glass, not the marketing
 * nav. Links back to the careers page's sections (they work from role pages
 * too) and a quiet link back to the main site.
 *
 * The back link is a plain absolute <a>, not next/link — this page is served on
 * careers.isocodelabs.com, a different host from the main site, so a relative
 * "/" would stay on the careers subdomain (and the middleware would just
 * rewrite it straight back to /careers) instead of actually leaving it.
 */
export function CareersNav() {
  return (
    <nav className={`${styles.nav} ${glass.glass} ${glass.dark}`} aria-label="Careers">
      <a href={careersHref('/')} className={styles.brand} aria-label="Isocode Careers">
        <Image src={monogram} alt="" className={styles.mark} priority />
        <span className={styles.name}>ISOCODE · CAREERS</span>
      </a>
      <ul className={styles.links}>
        <li>
          <a href={careersHref('/#roles')}>Open roles</a>
        </li>
        <li>
          <a href={careersHref('/#apply')}>Apply</a>
        </li>
      </ul>
      <a href={MAIN_SITE_URL} className={styles.back}>
        isocodelabs.com ↗
      </a>
    </nav>
  )
}
