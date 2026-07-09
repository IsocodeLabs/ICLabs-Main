import { Section } from '@/components/site/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { Squircle } from '@/components/ui/Squircle'
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
  creatorMention: { body: string; href: string }
}

/**
 * Labs & Innovation — the proof. No case studies; the products are the
 * evidence. Every card must look genuinely crafted.
 */
export function Labs({ beliefBeat, heading, body, products, creatorMention }: LabsProps) {
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
            <div key={p.slug} data-product className={styles.productCardShadow}>
              <Squircle radius={24} as="a" className={styles.productCard} {...linkProps(p.outboundURL)}>
                <div className={styles.productImageWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={`${p.name} — preview`} loading="lazy" />
                </div>
                <div className={styles.productBody}>
                  <div className={styles.productTopRow}>
                    <span className={styles.productName}>{p.name}</span>
                    <span className={`mono-label ${styles.productStatus}`}>{p.statusLabel}</span>
                  </div>
                  <p className={styles.productBlurb}>{p.blurb}</p>
                  <span className={`mono-label ${styles.productBadge}`}>{p.badge}</span>
                </div>
              </Squircle>
            </div>
          ))}
        </Reveal>

        <Reveal className={styles.creatorMention}>
          <p>
            {creatorMention.body}{' '}
            <a href={creatorMention.href} rel="noreferrer">
              creator.isocodelabs.com →
            </a>
          </p>
        </Reveal>
      </div>
    </Section>
  )
}

const linkProps = (href: string) => ({ href, target: '_blank', rel: 'noreferrer' })

/** Emphasise the second clause with a crafted underline — belief said out loud. */
function formatBeat(beat: string) {
  const marker = 'We build and run our own.'
  const idx = beat.indexOf(marker)
  if (idx === -1) return beat
  return (
    <>
      {beat.slice(0, idx)}
      <em>{beat.slice(idx)}</em>
    </>
  )
}
