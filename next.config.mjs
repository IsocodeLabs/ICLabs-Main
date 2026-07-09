import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Off so React's dev-only double-mount doesn't create→destroy the WebGL hero
  // canvas on every load (the destroy fired a context-loss that dropped us to
  // the static frame). Production never double-mounts, so this changes only the
  // dev experience, not shipped behaviour.
  reactStrictMode: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

export default withPayload(nextConfig)
