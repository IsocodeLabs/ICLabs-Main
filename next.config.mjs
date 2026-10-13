import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // On (React default). It was disabled during the WebGL era because the dev
  // double-mount create→destroyed the hero's GPU canvas; the hero is now pure
  // CSS/DOM, so the dev-only safety checks are back on. No shipped impact.
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Optimized variants (founder photos, logos) are cached for 30 days instead
    // of Next's default 4 hours. Static imports are content-hashed, so a changed
    // one gets a new URL anyway; for a /public image, give the replacement a new
    // filename so it shows immediately.
    minimumCacheTTL: 2592000,
  },
  // Files served straight from /public aren't content-hashed (the heavy art is:
  // it lives in src/assets/art and is served immutable for a year). Cache these
  // for a week, then revalidate in the background — if you replace one in place,
  // visitors get the new file within a week; rename it to roll out immediately.
  async headers() {
    const week = 'public, max-age=604800, stale-while-revalidate=86400'
    return ['/assets/:path*', '/quiz/:path*', '/labs/:path*', '/hero/:path*', '/og.png', '/og-careers.png', '/logo.webp'].map(
      (source) => ({ source, headers: [{ key: 'Cache-Control', value: week }] }),
    )
  },
}

export default withPayload(nextConfig)
