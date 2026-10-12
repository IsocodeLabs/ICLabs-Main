import Link from 'next/link'
import Image from 'next/image'
import { WorldBackground } from '@/components/motion/WorldBackground'
import { ProductMark } from '@/components/sections/ProductMark'
import { NotifyForm } from './NotifyForm'
import { comingSoonCopy } from '@/lib/seed-data'
import styles from './ComingSoon.module.css'
import monogram from '../../../public/assets/brand/il-monogram-black.png'

type Props = {
  slug: string
  page: { name: string; tagline: string; body: string }
}

/**
 * Coming-soon page for a product that hasn't launched. Same world as the main
 * site — sky stage, one glass card, the product's own mark — and one thing to
 * do: leave an email and be told when it opens.
 */
export function ComingSoon({ slug, page }: Props) {
  return (
    <>
      <WorldBackground />
      <main className={styles.page}>
        <header className={styles.top}>
          <Link href="https://isocodelabs.com" className={styles.brand} aria-label="ISOCODELABS — home">
            <Image src={monogram} alt="" className={styles.brandMark} priority />
            <span className={styles.brandName}>ISOCODELABS</span>
          </Link>
          <Link href="https://isocodelabs.com" className={styles.back}>
            {comingSoonCopy.backLabel}
          </Link>
        </header>

        <section className={styles.stage}>
          <div className={styles.card}>
            <div className={styles.lockup}>
              <ProductMark slug={slug} name={page.name} className={styles.mark} />
              <span className={styles.wordmark}>{page.name}</span>
            </div>

            <span className={`mono-label ${styles.badge}`}>
              <span className={styles.dot} aria-hidden />
              {comingSoonCopy.badge}
            </span>

            <h1 className={styles.tagline}>{page.tagline}</h1>
            <p className={styles.body}>{page.body}</p>

            <div className={styles.notify}>
              <h2 className={styles.notifyHeading}>{comingSoonCopy.notifyHeading}</h2>
              <NotifyForm productName={page.name} />
            </div>
          </div>
        </section>

        <footer className={styles.foot}>
          <span>© Isocode Labs {new Date().getFullYear()}</span>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </footer>
      </main>
    </>
  )
}
