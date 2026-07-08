import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { fontVariables } from '@/lib/fonts'
import { getSiteContent } from '@/lib/content'
import { LenisProvider } from '@/components/motion/LenisProvider'
import { GrainOverlay } from '@/components/ui/GrainOverlay'
import { Nav } from '@/components/site/Nav'
import '@/styles/globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSiteContent()
  const url = process.env.NEXT_PUBLIC_SERVER_URL || 'https://isocodelabs.com'
  return {
    metadataBase: new URL(url),
    title: {
      default: seo.metaTitle,
      template: '%s — ISOCODELABS',
    },
    description: seo.metaDescription,
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      url,
      siteName: 'ISOCODELABS',
      type: 'website',
      images: ['/og.png'],
    },
  }
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { contact, footer } = await getSiteContent()
  const url = process.env.NEXT_PUBLIC_SERVER_URL || 'https://isocodelabs.com'

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Isocode Labs',
    url,
    logo: `${url}/logo.webp`,
    email: contact.email,
  }

  return (
    <html lang="en" className={fontVariables}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <LenisProvider>
          <Nav contactEmail={contact.email} />
          {children}
          <GrainOverlay />
        </LenisProvider>
      </body>
    </html>
  )
}
