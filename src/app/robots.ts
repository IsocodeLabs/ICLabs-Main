import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const url = process.env.NEXT_PUBLIC_SERVER_URL || 'https://isocodelabs.com'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/design'],
    },
    sitemap: `${url}/sitemap.xml`,
  }
}
