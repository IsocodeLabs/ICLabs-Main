/**
 * Encodes the site's background / hero art into AVIF (primary) + WebP
 * (fallback) under src/assets/art/. Components and CSS modules import from
 * there, so Next serves each file from /_next/static/media/<name>.<hash>.<ext>
 * with `Cache-Control: public, max-age=31536000, immutable` — browsers and
 * Cloudflare keep them for a year, and a changed image gets a new hash (URL)
 * automatically, so nothing is ever served stale.
 *
 *   node scripts/build-art.mjs        # re-run after replacing a master image
 *
 * Masters stay where they were (public/assets/...), untouched.
 */
import sharp from 'sharp'
import { mkdirSync, statSync } from 'node:fs'
import path from 'node:path'

const OUT = 'src/assets/art'
mkdirSync(OUT, { recursive: true })

// [master, output name, { avif quality, webp quality }]
const ART = [
  // homepage hero (desktop layered scene + reduced-motion still)
  ['public/assets/hero/hero-l1-sky.webp', 'hero-sky', { avif: 55, webp: 80 }],
  ['public/assets/hero/hero-l2-figures.webp', 'hero-figures', { avif: 60, webp: 80 }],
  ['public/assets/hero/hero-l3-flora.webp', 'hero-flora', { avif: 60, webp: 80 }],
  ['public/assets/hero/hero-static.webp', 'hero-static', { avif: 55, webp: 80 }],
  // homepage world background: desktop sky + flora band, iPad / phone plates
  ['public/assets/sections/section-bg-sky.webp', 'world-sky', { avif: 55, webp: 80 }],
  ['public/assets/sections/section-flora-edges.webp', 'world-flora', { avif: 60, webp: 80 }],
  ['public/assets/hero/hero-ipad.jpg', 'world-ipad', { avif: 55, webp: 78 }],
  ['public/assets/hero/hero-phone.jpg', 'world-phone', { avif: 55, webp: 78 }],
  // careers world: desktop plate + flora layer, iPad / phone plates
  ['public/assets/careers/careers-base.webp', 'careers-base', { avif: 62, webp: 90 }],
  ['public/assets/careers/careers-layer.webp', 'careers-layer', { avif: 60, webp: 80 }],
  ['public/assets/careers/careers-ipad.webp', 'careers-ipad', { avif: 55, webp: 78 }],
  ['public/assets/careers/careers-phone.webp', 'careers-phone', { avif: 55, webp: 78 }],
]

let before = 0
let after = 0
for (const [src, name, q] of ART) {
  const input = sharp(src)
  const avif = path.join(OUT, `${name}.avif`)
  const webp = path.join(OUT, `${name}.webp`)
  await input.clone().avif({ quality: q.avif, effort: 7, chromaSubsampling: '4:4:4' }).toFile(avif)
  await input.clone().webp({ quality: q.webp, effort: 6, smartSubsample: true }).toFile(webp)
  const s = statSync(src).size
  const a = statSync(avif).size
  const w = statSync(webp).size
  before += s
  after += a
  console.log(`${name.padEnd(16)} ${String(s >> 10).padStart(4)} KiB → avif ${String(a >> 10).padStart(4)} KiB · webp ${String(w >> 10).padStart(4)} KiB`)
}
console.log(`total (master → avif): ${before >> 10} KiB → ${after >> 10} KiB`)
