import Link from 'next/link'
import Image from 'next/image'
import glass from '@/components/ui/Glass.module.css'
import styles from './CareersNav.module.css'
import monogram from '../../../public/assets/brand/il-monogram-white.png'

/**
 * Careers' own minimal chrome — white monogram on dark glass, not the marketing
 * nav. Two in-page anchors and a quiet link back to the main site.
 */
export function CareersNav() {
  return (
    <nav className={`${styles.nav} ${glass.glass} ${glass.dark}`} aria-label="Careers">
      <a href="#top" className={styles.brand} aria-label="Isocode Careers">
        <Image src={monogram} alt="" className={styles.mark} priority />
        <span className={styles.name}>ISOCODE · CAREERS</span>
      </a>
      <ul className={styles.links}>
        <li>
          <a href="#roles">Open roles</a>
        </li>
        <li>
          <a href="#apply">Apply</a>
        </li>
      </ul>
      <Link href="/" className={styles.back}>
        isocodelabs.com ↗
      </Link>
    </nav>
  )
}
