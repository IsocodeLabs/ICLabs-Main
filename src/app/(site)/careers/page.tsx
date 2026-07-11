import type { Metadata } from 'next'
import { getCareersContent } from '@/lib/content'
import { CareersPage } from '@/components/careers/CareersPage'

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Isocode is hiring — a small, senior studio held to one bar: craft. Remote roles in engineering, design, and sales, plus an always-open application.',
  // canonical is the live subdomain, not this shadow path on the main domain —
  // careers.isocodelabs.com's root is what the middleware rewrites to here.
  alternates: { canonical: 'https://careers.isocodelabs.com' },
}

export const revalidate = 300

export default async function CareersRoute() {
  const content = await getCareersContent()
  return <CareersPage content={content} />
}
