import type { Metadata } from 'next'
import { getCareersContent } from '@/lib/content'
import { CareersPage } from '@/components/careers/CareersPage'

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Isocode is hiring — a small, senior studio held to one bar: craft. Remote roles in engineering, design, and sales, plus an always-open application.',
  alternates: { canonical: '/careers' },
}

export const revalidate = 300

export default async function CareersRoute() {
  const content = await getCareersContent()
  return <CareersPage content={content} />
}
