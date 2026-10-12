import { Section } from '@/components/site/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { ProductMark } from './ProductMark'
import styles from './Sections.module.css'

type Product = {
  name: string
  slug: string
  blurb: string
  statusLabel: string
  badge: string
  outboundURL: string
  image: string
}

type LabsProps = {
  beliefBeat: string
  heading: string
  body: string
  products: Product[]
}

/**
 * Labs & Innovation — the proof. No case studies; the products are the
 * evidence. Every card must look genuinely crafted.
 */
export function Labs({ beliefBeat, heading, body, products }: LabsProps) {
  return (
    <Section id="labs" trail="left" flora={{ side: 'left', flip: true, scale: 1.05 }} className={styles.section}>
      <div className={styles.inner}>
        <Reveal className={styles.panel}>
          <div className={styles.eyebrowRow}>
            <Eyebrow>{heading}</Eyebrow>
          </div>
          <h2 className={styles.beliefBeat}>{formatBeat(beliefBeat)}</h2>
          <p className={styles.leadMuted} style={{ marginTop: 'var(--sp-24)', maxWidth: '48ch' }}>
            {body}
          </p>
        </Reveal>

        <Reveal stagger="[data-product]" className={styles.labsGrid}>
          {products.map((p) => (
            <a key={p.slug} data-product className={styles.productCard} {...linkProps(p.outboundURL)}>
              {/* one logo family: a sheared monogram + tracked wordmark, the
                  same lockup as the studio's own — ink on paper */}
              <div className={styles.productLogoTile}>
                <div className={styles.productLockup}>
                  <ProductMark slug={p.slug} name={p.name} className={styles.productMark} />
                  <span className={styles.productWordmark}>{p.name}</span>
                </div>
              </div>
              <div className={styles.productBody}>
                <p className={styles.productBlurb}>{p.blurb}</p>
                <div className={styles.productFoot}>
                  <span className={`mono-label ${styles.productFrom}`}>
                    {/coming soon/i.test(p.statusLabel) ? 'Notify me →' : 'Visit →'}
                  </span>
                  {p.statusLabel && (
                    <span className={`mono-label ${styles.productStatus}`}>{p.statusLabel}</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </Reveal>
      </div>
    </Section>
  )
}

const linkProps = (href: string) => ({ href, target: '_blank', rel: 'noreferrer' })

/** Emphasise the second clause with a crafted underline — belief said out loud. */
function formatBeat(beat: string) {
  const marker = ['our own, too.', 'We build and run our own.'].find((m) => beat.includes(m))
  if (!marker) return beat
  const idx = beat.indexOf(marker)
  return (
    <>
      {beat.slice(0, idx)}
      <em>{beat.slice(idx)}</em>
    </>
  )
}
