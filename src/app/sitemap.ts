import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const url = process.env.NEXT_PUBLIC_SERVER_URL || 'https://isocodelabs.com'
  return [
    { url, changeFrequency: 'monthly', priority: 1 },
    { url: `${url}/quiz`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${url}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${url}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
