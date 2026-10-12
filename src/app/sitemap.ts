import type { MetadataRoute } from 'next'
import { getCareerRoles } from '@/lib/careers/content'
import { canonicalCareersUrl } from '@/lib/careers/urls'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SERVER_URL || 'https://isocodelabs.com'
  const roles = (await getCareerRoles()).filter(
    (r) => r.roleKind !== 'open' && (r.status === 'open' || r.status === 'paused'),
  )
  return [
    { url, changeFrequency: 'monthly', priority: 1 },
    { url: `${url}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${url}/quiz`, changeFrequency: 'monthly', priority: 0.8 },
    { url: canonicalCareersUrl('/'), changeFrequency: 'weekly', priority: 0.7 },
    ...roles.map((r) => ({
      url: canonicalCareersUrl(`/roles/${r.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    { url: canonicalCareersUrl('/applicant-privacy'), changeFrequency: 'yearly', priority: 0.1 },
    { url: `${url}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${url}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
