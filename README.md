# isocodelabs.com — v3

The ISOCODELABS marketing site: a craftsmanship studio that happens to build
software. Next.js (App Router) + Payload CMS (Postgres) + Lenis + GSAP
ScrollTrigger + React Three Fiber.

**Versioning:** this repo holds three entirely different sites — `v1.0.0`
(the `old` branch), `v2.0.0` (`main`), and **v3.0.0 (this branch, `v3`)** —
each with its own brand philosophy. Don't mix them.

---

## Local development

```bash
npm install

# 1. start the dev database (embedded Postgres — no system install needed;
#    data persists in .db/)
npm run dev:db

# 2. in another shell: seed the CMS with the canonical copy-deck content
cp .env.example .env       # defaults match dev-db
npm run seed

# 3. run the site
npm run dev
```

- Site: http://localhost:3000
- Admin (CMS + ops): http://localhost:3000/admin — first run asks you to
  create the admin user (dev DB already has `malhotra.aryan.a01@gmail.com` /
  `change-me-isocodelabs` — **change it**).
- Design-system QA page (dev only): http://localhost:3000/design

The site renders the canonical copy as a fallback whenever the CMS is empty
or unreachable — it never ships a blank page.

## Architecture

| Layer | What |
|---|---|
| `src/styles/tokens.css` | The design constitution as CSS custom properties (ui.md 1:1 — palette, copper-as-metal gradients, type scale, spacing, radii, ink-tinted shadows, glass, motion) |
| `src/components/ui` | Primitives: `Squircle` (G2 continuous corners), `Button` (forged-copper pill), `Glass`, `Eyebrow`, `GrainOverlay` |
| `src/components/motion` | `LenisProvider` (gentle smooth scroll), `Reveal`, `BackgroundConductor` (section-blend system), `TrailSpine` (the guiding trail, desktop only) |
| `src/components/hero` | The WebGL hero: 3 painterly layers, wind-sway shader on the flora, gliding paper-plane sprite (extracted + sky inpainted at build), breathing laptop glow, scroll/pointer parallax, pinned text journey |
| `src/lib/capability.ts` | The single motion gate: reduced-motion / save-data / device-memory / hardware-GL / adaptive fps floor → tiers `full · reduced · static` |
| `src/collections`, `src/globals` | Payload schema per `isocodelabs-payload-schema.md` |
| `src/lib/seed-data.ts` | Copy deck transcribed — seed source **and** render fallback |
| `src/app/actions.ts` | `submitLead` — the only public write path (validated, honeypot, admin-only reads) |

### Hero fallback ladder (ux.md law 1)

WebGL scene → requires: desktop ≥1025px, motion tier `full`, hardware GL
(`failIfMajorPerformanceCaveat`), then must *hold* ~30fps through its first
seconds and survive context loss — any failure swaps to the static composited
frame (`/hero/hero-static.webp`, mobile crop on phones). Reduced-motion users
get the still with no scroll theatre.

### Asset pipeline

- `scripts/prep-hero-assets.py ../ public/hero` — derives WebGL textures from
  the source layers (l1/l2/l3): extracts the paper-plane sprite + inpaints the
  sky behind it, removes the low-alpha export veil (keeps the warm halos),
  builds the static/mobile composites. Source art is never modified.
- `scripts/gen-placeholders.py` — placeholder quiz tiles + OG image.

## Still to generate (placeholders in place)

Per `isocodelabs-asset-manifest.md` / `isocodelabs-asset-prompts.md`:

1. **8 short-quiz tiles** (`public/quiz/`) — Q3 brand-style ×4 (bold / warm /
   minimal / editorial) + Q4 feeling ×4 (trust / desire / calm / delight), one
   consistent art system (copper-as-light against depth). Current files are
   abstract CSS-grade placeholders.
2. **OG image** (`public/og.png`, 1200×630) — currently a typographic placeholder.
3. *(Deferred, not launch-blocking)* Labs logos redrawn as clean SVG; long-quiz
   image sets (~16).

## Deploying to GCP

Target: **Cloud Run + Cloud SQL (Postgres)**.

1. Cloud SQL Postgres instance → set `DATABASE_URI`.
2. `PAYLOAD_SECRET` → long random string (Secret Manager).
3. `NEXT_PUBLIC_SERVER_URL=https://isocodelabs.com`.
4. Build the container (`Dockerfile` included) → deploy to Cloud Run
   (min instances 1 recommended — Payload cold starts).
5. Media uploads currently write to local disk (`media/`); for Cloud Run add
   `@payloadcms/storage-gcs` (GCS bucket) before launch.
6. Run `npm run seed` once against the production DB.

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Next dev server (Turbopack) |
| `npm run dev:db` | Embedded Postgres on `127.0.0.1:5502` |
| `npm run seed` | Seed CMS from the copy deck (idempotent) |
| `npm run build` / `start` | Production build / serve |
| `npm run generate:types` | Regenerate `src/payload-types.ts` after schema changes |
| `npm run generate:importmap` | Regenerate the Payload admin import map |
