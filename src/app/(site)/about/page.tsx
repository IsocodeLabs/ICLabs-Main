import type { Metadata } from 'next'
import { getAboutPageContent, getSiteContent } from '@/lib/content'
import { AboutPage } from '@/components/pages/AboutPage'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Isocode Labs is a craftsmanship studio that happens to build software — a small senior team held to a single bar. Meet the people and the values behind it.',
  alternates: { canonical: '/about' },
}

export const revalidate = 300

export default async function AboutRoute() {
  const [content, site] = await Promise.all([getAboutPageContent(), getSiteContent()])
  return <AboutPage content={content} footer={site.footer} />
}
