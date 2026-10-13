import type { StaticImageData } from 'next/image'

/** 1×1 transparent GIF: lets a <source> "match" without any network request. */
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * A pre-encoded art image (src/assets/art — see scripts/build-art.mjs) as
 * <picture>: AVIF first, WebP fallback, both content-hashed and cached for a
 * year. These are already sized for their slot, so they skip the runtime
 * image optimizer.
 *
 * `desktopOnly`: below 1025px the picture resolves to an inline blank GIF, so
 * phones/tablets never download desktop-only art even when the server
 * rendered the desktop scene (the client then swaps in the device layout).
 */
export function ArtPicture({
  avif,
  webp,
  alt,
  className,
  desktopOnly,
  priority,
}: {
  avif: StaticImageData
  webp: StaticImageData
  alt: string
  className?: string
  desktopOnly?: boolean
  priority?: boolean
}) {
  return (
    <picture>
      {desktopOnly && <source media="(max-width: 1024px)" srcSet={BLANK} />}
      <source type="image/avif" srcSet={avif.src} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={webp.src}
        width={webp.width}
        height={webp.height}
        alt={alt}
        className={className}
        fetchPriority={priority ? 'high' : undefined}
        decoding={priority ? 'sync' : 'async'}
      />
    </picture>
  )
}
