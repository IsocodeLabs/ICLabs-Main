'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Section } from '@/components/site/Section'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import styles from './Faq.module.css'

type FaqItem = { q: string; a: string; link?: { label: string; href: string } }

type FaqProps = {
  eyebrow: string
  heading: string
  intro: string
  askLabel: string
  items: FaqItem[]
  contactEmail: string
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * FAQ — the objections a serious buyer has before writing in, answered
 * briefly. A black card in the middle of the light page: hairline rows,
 * mono index, a quiet +/– and one outlined numeral that follows the open
 * question. One question open at a time; the first is open on arrival.
 * No trail anchor — the guiding line passes through, unchanged.
 */
export function Faq({ eyebrow, heading, intro, askLabel, items, contactEmail }: FaqProps) {
  const [open, setOpen] = useState<number>(0)
  // nothing open: show how many questions there are instead of a position
  const noneOpen = open < 0

  return (
    <Section id="faq" className={styles.section}>
      <div className={styles.inner}>
        <Reveal className={`theme-ink ${styles.panel}`}>
          <div className={styles.grid}>
            <div className={styles.aside}>
              <span className={`mono-label ${styles.eyebrow}`}>{eyebrow}</span>
              <h2 className={styles.heading}>{heading}</h2>
              <p className={styles.intro}>{intro}</p>

              <div className={styles.counter} aria-hidden>
                <span key={open} className={styles.counterNum}>
                  {pad(noneOpen ? items.length : open + 1)}
                </span>
                <span className={styles.counterTotal}>
                  {noneOpen ? 'questions' : `/ ${pad(items.length)}`}
                </span>
              </div>

              <div className={styles.ask}>
                <Button href={`mailto:${contactEmail}`} variant="ghost" size="sm">
                  {askLabel}
                </Button>
              </div>
            </div>

            <div className={styles.list}>
              {items.map((item, i) => {
                const isOpen = open === i
                const id = `faq-${i}`
                return (
                  <div key={item.q} className={styles.row} data-open={isOpen || undefined}>
                    <h3 className={styles.qWrap}>
                      <button
                        type="button"
                        id={`${id}-q`}
                        className={styles.q}
                        aria-expanded={isOpen}
                        aria-controls={`${id}-a`}
                        onClick={() => setOpen(isOpen ? -1 : i)}
                      >
                        <span className={`mono-label ${styles.num}`}>{pad(i + 1)}</span>
                        <span className={styles.qText}>{item.q}</span>
                        <span className={styles.icon} aria-hidden />
                      </button>
                    </h3>
                    <div
                      id={`${id}-a`}
                      role="region"
                      aria-labelledby={`${id}-q`}
                      className={styles.aWrap}
                    >
                      <div className={styles.aInner}>
                        <p className={styles.a}>{item.a}</p>
                        {item.link && (
                          <Link href={item.link.href} className={styles.aLink}>
                            {item.link.label} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
