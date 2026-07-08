'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import glass from '@/components/ui/Glass.module.css'
import styles from './Nav.module.css'

/** Floating glass nav — minimal, one CTA. No hamburger; the page is the menu. */
export function Nav({ contactEmail }: { contactEmail: string }) {
  const pathname = usePathname()
  // the quiz is a focused surface with its own top bar — no competing chrome
  if (pathname?.startsWith('/quiz')) return null
  return (
    <nav className={`${styles.nav} ${glass.glass}`} aria-label="Main">
      <Link href="/#top" className={styles.wordmark}>
        ISOCODE<span>LABS</span>
      </Link>
      <ul className={styles.links}>
        <li>
          <Link href="/#what-we-build">What we build</Link>
        </li>
        <li>
          <Link href="/#labs">Labs</Link>
        </li>
        <li>
          <Link href="/#about">About</Link>
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
