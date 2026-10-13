import type { Metadata } from 'next'
import { getCareersContent } from '@/lib/careers/content'
import { canonicalCareersUrl } from '@/lib/careers/urls'
import { careersContent } from '@/lib/seed-data'
import { CAREERS_OG_IMAGE } from '@/lib/careers/og'
import { CareersPage } from '@/components/careers/CareersPage'

export const metadata: Metadata = {
  title: 'Careers',
  description: careersContent.metaDescription,
  // canonical is the live subdomain, not this shadow path on the main domain —
  // careers.isocodelabs.com's root is what the middleware rewrites to here.
  alternates: { canonical: canonicalCareersUrl('/') },
  openGraph: {
    title: 'Careers — ISOCODELABS',
    description: careersContent.metaDescription,
    url: canonicalCareersUrl('/'),
    siteName: 'ISOCODELABS',
    type: 'website',
    images: [CAREERS_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Careers — ISOCODELABS',
    description: careersContent.metaDescription,
    images: [CAREERS_OG_IMAGE.url],
  },
}

// Role status changes revalidate on demand (JobOpenings afterChange); 60 s is the
// backstop for other Cloud Run instances' caches.
export const revalidate = 60

export default async function CareersRoute() {
  const content = await getCareersContent()
  return <CareersPage content={content} />
}
