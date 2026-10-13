import type { Metadata } from 'next'
import { getCareersContent } from '@/lib/careers/content'
import { canonicalCareersUrl } from '@/lib/careers/urls'
import { careersContent } from '@/lib/seed-data'
import { CareersPage } from '@/components/careers/CareersPage'

export const metadata: Metadata = {
  title: { absolute: careersContent.metaTitle },
  description: careersContent.metaDescription,
  // canonical is the live subdomain, not this shadow path on the main domain —
  // careers.isocodelabs.com's root is what the middleware rewrites to here.
  alternates: { canonical: canonicalCareersUrl('/') },
  openGraph: {
    title: careersContent.ogTitle,
    description: careersContent.ogDescription,
    url: canonicalCareersUrl('/'),
    siteName: 'ISOCODELABS',
    type: 'website',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: careersContent.ogTitle,
    description: careersContent.ogDescription,
  },
}

// Role status changes revalidate on demand (JobOpenings afterChange); 60 s is the
// backstop for other Cloud Run instances' caches.
export const revalidate = 60

export default async function CareersRoute() {
  const content = await getCareersContent()
  return <CareersPage content={content} />
}
