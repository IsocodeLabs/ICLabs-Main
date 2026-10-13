import type { CSSProperties } from 'react'
import type { StaticImageData } from 'next/image'

/**
 * CSS custom properties for a pre-encoded background (src/assets/art):
 *   --<name>      url(<webp>)                          — universal fallback
 *   --<name>-set  image-set(<avif> avif, <webp> webp)  — used when supported
 *
 * The URLs come from static imports, so they're content-hashed and served
 * immutable for a year. (Turbopack doesn't rewrite asset paths inside CSS
 * image-set(), so the URLs are passed in from TS instead of written in CSS.)
 * CSS modules still decide which layer shows per device, so the browser only
 * fetches the background of the layer it displays.
 */
export function artVars(entries: Record<string, { avif: StaticImageData; webp: StaticImageData }>) {
  const vars: Record<string, string> = {}
  for (const [name, { avif, webp }] of Object.entries(entries)) {
    vars[`--${name}`] = `url("${webp.src}")`
    vars[`--${name}-set`] = `image-set(url("${avif.src}") type("image/avif"), url("${webp.src}") type("image/webp"))`
  }
  return vars as CSSProperties
}
