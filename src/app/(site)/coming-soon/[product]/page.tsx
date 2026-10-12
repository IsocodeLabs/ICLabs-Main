import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { comingSoonContent } from '@/lib/seed-data'
import { ComingSoon } from '@/components/pages/ComingSoon'

type Params = Promise<{ product: string }>

export function generateStaticParams() {
  return Object.keys(comingSoonContent).map((product) => ({ product }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { product } = await params
  const page = comingSoonContent[product]
  if (!page) return {}
  return {
    title: `${page.name} — Coming soon`,
    description: `${page.tagline} ${page.name} is coming soon from Isocode Labs.`,
    // the live address is the subdomain; this path is its shadow on the main domain
    alternates: { canonical: page.canonical },
  }
}

export default async function ComingSoonRoute({ params }: { params: Params }) {
  const { product } = await params
  const page = comingSoonContent[product]
  if (!page) notFound()
  return <ComingSoon slug={product} page={page} />
}
