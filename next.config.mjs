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
  },
}

export default withPayload(nextConfig)
