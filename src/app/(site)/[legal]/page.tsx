import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { legalStubs } from '@/lib/seed-data'
import styles from '../legal.module.css'

const SLUGS = ['privacy', 'terms'] as const

export function generateStaticParams() {
  return SLUGS.map((legal) => ({ legal }))
}

export const revalidate = 3600

type Params = { params: Promise<{ legal: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { legal } = await params
  const stub = legalStubs.find((s) => s.slug === legal)
  return { title: stub?.title ?? 'Legal', robots: { index: false } }
}

export default async function LegalPage({ params }: Params) {
  const { legal } = await params
  if (!SLUGS.includes(legal as (typeof SLUGS)[number])) notFound()

  const stub = legalStubs.find((s) => s.slug === legal)!

  // Prefer the CMS page when it exists; fall back to the structured stub.
  let cmsBody: unknown = null
  let title = stub.title
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
    // CMS unavailable — stub carries it
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href="/" className={styles.back}>
          ← isocodelabs.com
        </Link>
        <h1 className={styles.title}>{title}</h1>
        {!cmsBody && <p className={styles.note}>{stub.note}</p>}
        <div className={styles.body}>
          {cmsBody ? (
            <RichText data={cmsBody as never} />
          ) : (
            stub.sections.map((s) => (
              <section key={s.heading}>
                <h2>{s.heading}</h2>
                <p>{s.body}</p>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
