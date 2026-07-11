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
    logo: `${url}/assets/brand/il-monogram-black.png`,
    email: contact.email,
  }

  return (
    <html lang="en" className={fontVariables}>
      <body>
        {/* Pre-paint: on the careers.* subdomain the middleware rewrites / → /careers,
            so the client URL path stays "/" and the marketing <Nav>'s pathname guard
            can't detect it — leaving the main nav stacked over the CareersNav. This
            runs before first paint and flags the host so CSS hides the main nav with
            no flash and without forcing dynamic rendering. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(location.hostname.indexOf('careers.')===0){document.documentElement.setAttribute('data-careers-host','')}}catch(e){}`,
          }}
        />
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
