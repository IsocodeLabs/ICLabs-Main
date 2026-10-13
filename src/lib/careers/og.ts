/**
 * Careers share image (LinkedIn / WhatsApp / X previews): public/og-careers.png,
 * 1200×630, the careers desk plate with "We're hiring." in the house type.
 *
 * Next replaces — doesn't merge — a layout's openGraph when a page sets its
 * own, so every careers page that sets openGraph must list this image itself,
 * or the preview goes out with no picture.
 */
export const CAREERS_OG_IMAGE = {
  url: '/og-careers.png',
  width: 1200,
  height: 630,
  alt: 'ISOCODELABS Careers — We’re hiring. Remote internships in business growth, product and engineering.',
}
