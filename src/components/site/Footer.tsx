import Link from 'next/link'
import { Section } from '@/components/site/Section'
import styles from './Footer.module.css'

type FooterProps = {
  beliefLine: string
  navLinks: Array<{ label: string; href: string }>
  legalLinks: Array<{ label: string; href: string }>
  copyright: string
}

/** Quiet close — the trail resolves here, the belief restated once. */
export function Footer({ beliefLine, navLinks, legalLinks, copyright }: FooterProps) {
  const year = new Date().getFullYear()
  return (
    <Section bg="#1A1714" theme="midnight" glow={0.45} trail="center" className={styles.footer}>
      <footer className={styles.inner}>
        <span className={styles.wordmark}>
          ISOCODE<span>LABS</span>
        </span>
        <p className={styles.belief}>{beliefLine}</p>
        <ul className={styles.nav}>
          {navLinks.map((l) => (
            <li key={l.href}>
              {l.href.startsWith('http') ? (
                <a href={l.href} rel="noreferrer">
                  {l.label}
                </a>
              ) : (
                <Link href={l.href.startsWith('#') ? `/${l.href}` : l.href}>{l.label}</Link>
              )}
            </li>
          ))}
        </ul>
        <div className={styles.legalRow}>
          <span>
            {copyright} {year}
          </span>
          {legalLinks.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
      </footer>
    </Section>
  )
}
