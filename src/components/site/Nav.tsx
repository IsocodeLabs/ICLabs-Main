'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import glass from '@/components/ui/Glass.module.css'
import styles from './Nav.module.css'
import monogram from '../../../public/assets/brand/il-monogram-black.png'

/** Floating glass nav — IL monogram, ink on paper. One CTA; the page is the menu. */
export function Nav({ contactEmail }: { contactEmail: string }) {
  const pathname = usePathname()
  // the quiz and careers are focused surfaces with their own chrome
  if (pathname?.startsWith('/quiz') || pathname?.startsWith('/careers')) return null
  return (
    <nav className={`${styles.nav} ${glass.glass}`} aria-label="Main">
      <Link href="/#top" className={styles.brand} aria-label="ISOCODELABS — home">
        <Image src={monogram} alt="" className={styles.mark} priority />
        <span className={styles.name}>ISOCODELABS</span>
      </Link>
      <ul className={styles.links}>
        <li>
          <Link href="/#what-we-build">What we build</Link>
        </li>
        <li>
          <Link href="/#labs">Labs</Link>
        </li>
        <li>
          <Link href="/about">About</Link>
        </li>
        <li>
          <a href={`mailto:${contactEmail}`}>Contact</a>
        </li>
      </ul>
      <Button href="/quiz" size="sm">
        Work with us
      </Button>
    </nav>
  )
}
