'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import glass from '@/components/ui/Glass.module.css'
import styles from './Nav.module.css'
import monogram from '../../../public/assets/brand/il-monogram-black.png'

type NavLink = { label: string; href: string; external?: boolean }

/** Floating glass nav — IL monogram, ink on paper. Links collapse into a
 *  left-hand dropdown on phone/iPad; the studio CTA always stays visible. */
export function Nav({ contactEmail }: { contactEmail: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // close the mobile menu whenever the route changes
  useEffect(() => setOpen(false), [pathname])

  // the quiz and careers are focused surfaces with their own chrome
  if (pathname?.startsWith('/quiz') || pathname?.startsWith('/careers')) return null

  const links: NavLink[] = [
    { label: 'Labs', href: '/#labs' },
    { label: 'Careers', href: '/careers' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: `mailto:${contactEmail}`, external: true },
  ]

  const renderLink = (l: NavLink, onClick?: () => void) =>
    l.external ? (
      <a href={l.href} onClick={onClick}>
        {l.label}
      </a>
    ) : (
      <Link href={l.href} onClick={onClick}>
        {l.label}
      </Link>
    )

  return (
    <>
      {/* mobile menu — left-mounted, separate from the centred pill */}
      <div className={styles.menuMount}>
        <button
          type="button"
          className={`${styles.hamburger} ${glass.glass}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>

        {open && (
          <>
            <button
              type="button"
              className={styles.backdrop}
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
            />
            <div id="nav-menu" className={styles.dropdown}>
              {links.map((l) => (
                <span key={l.label} className={styles.dropdownItem}>
                  {renderLink(l, () => setOpen(false))}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* the centred pill — monogram, desktop links, studio CTA */}
      <nav className={`${styles.nav} ${glass.glass}`} aria-label="Main">
        <Link href="/#top" className={styles.brand} aria-label="ISOCODELABS — home">
          <Image src={monogram} alt="" className={styles.mark} priority />
          <span className={styles.name}>ISOCODELABS</span>
        </Link>

        <ul className={styles.links}>
          {links.map((l) => (
            <li key={l.label}>{renderLink(l)}</li>
          ))}
        </ul>

        <Button href="/quiz" size="sm">
          Start a project
        </Button>
      </nav>
    </>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}
