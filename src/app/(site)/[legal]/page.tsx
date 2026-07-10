import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { legalPages } from '@/lib/seed-data'
import styles from '../legal.module.css'

const SLUGS = ['privacy', 'terms'] as const

export function generateStaticParams() {
  return SLUGS.map((legal) => ({ legal }))
}

export const revalidate = 3600

type Params = { params: Promise<{ legal: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { legal } = await params
  const page = legalPages.find((s) => s.slug === legal)
  if (!page) return { title: 'Legal' }
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
  }
}

export default async function LegalPage({ params }: Params) {
  const { legal } = await params
  if (!SLUGS.includes(legal as (typeof SLUGS)[number])) notFound()

  const page = legalPages.find((s) => s.slug === legal)!
  const other = legalPages.find((s) => s.slug !== legal)!

  // Prefer the CMS page when it exists; fall back to the structured content.
  let cmsBody: unknown = null
  let title = page.title
  try {
    const payload = await getPayload({ config })
    const pages = await payload.find({
      collection: 'pages',
      where: { slug: { equals: legal } },
      limit: 1,
    })
    if (pages.docs[0]?.body) {
      cmsBody = pages.docs[0].body
      title = pages.docs[0].title
    }
  } catch {
    // CMS unavailable — the structured content carries it
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href="/" className={styles.back}>
          ← isocodelabs.com
        </Link>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Last updated: {page.updated}</p>

        <div className={styles.body}>
          {cmsBody ? (
            <RichText data={cmsBody as never} />
          ) : (
            <>
              {page.intro.map((p, i) => (
                <p key={`intro-${i}`} className={styles.lead}>
                  {p}
                </p>
              ))}
              {page.sections.map((s) => (
                <section key={s.heading}>
                  <h2>{s.heading}</h2>
                  {s.body?.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {s.bullets && (
                    <ul>
                      {s.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </>
          )}
        </div>

        <nav className={styles.crossLinks} aria-label="Other legal pages">
          <Link href={`/${other.slug}`}>{other.title} →</Link>
        </nav>
      </div>
    </div>
  )
}
