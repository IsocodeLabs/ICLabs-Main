# isocodelabs.com — Website PRD (as-built, v3.1.0)

*Written 2026-07-10, reflecting the site as it actually stands after Build 2 and the
motion/legibility fixes that followed it. This supersedes `isocodelabs-website-PRD.md`
(v1.0) on every execution detail — that doc specified a copper/Midnight WebGL build that
was never shipped that way. Strategy and positioning below are carried forward from it
where still true; everything about visual system, hero mechanism, and section behavior
is rewritten to match the real code. Use this doc as the base to build on.*

---

## 1. What this site is

A marketing site for Isocode, a studio that builds public-facing websites and apps for
mid-sized businesses, and also builds/runs its own products (Labs) and creator
businesses. One job: convert a cold, serious visitor into a **qualified quiz completion
or direct-contact inquiry**. The site's own craft is the proof — there are no case
studies, no client logos; the hero and the Labs section carry the argument.

Not in scope here: pricing, blog, case studies, investor material, client portal,
internal tooling. Those are explicitly out (see §8).

## 2. Audience & positioning

Unchanged from the original intent doc:
- **Primary:** founders/leaders of mid-sized businesses who care how their brand is
  perceived and refuse generic software.
- **Selectivity is the spine** — "we reach out only if we believe you'll benefit."
- **Scale by artifact, not adjective** — no superlatives, no fabricated traction.
- We market public-facing sites + apps only; internal software (ERP/CRM/AI-OS) is sold
  in person, never on the site.
- Labs + the creator program *are* the proof, not a sales pitch for those products —
  each product/creator has its own destination site; this site never sells them inline.

## 3. Visual system — monochrome, not copper/Midnight

The original PRD called for copper-as-light against a Midnight (dark blue) depth field.
**That was retired in Build 2.** The shipped system is:

- **Palette:** `--ink #141210` on `--paper #F5F1EA`, `--white`, `--grey #6B655E`,
  `--hairline #D8D2C8`. No copper, no gold, no midnight-blue anywhere in the chrome.
  Contrast comes from value + bold type, not color.
- **Imagery stays full-color** — the painterly hero/section artwork is warm, natural
  color; only the site's *chrome* (nav, type, buttons, borders) is monochrome.
- **Type:** Anton (display, one weight, uppercase, emphasis via a crafted underline —
  never faux-bold/italic) · General Sans (body) · Space Mono (eyebrows/labels, tracked
  caps). Fraunces and Geist Mono from the original spec were dropped.
- **Glass panels:** frosted paper (`--glass-bg` ~30–46% paper opacity, 22px blur, thin
  ink or luminous hairline edge) — used for the nav, stat cards, and quote panels over
  the painterly background.
- **Shape:** small radii throughout (6–16px) — hairlines and value contrast do the work
  a bigger radius/copper accent used to.
- Tokens live in `src/styles/tokens.css`; section registers (`theme-paper` /
  `theme-ink`) in the same file.

## 4. The hero — CSS-layered scene, not WebGL

The original PRD called for a WebGL 2.5D depth-map parallax hero. **That was built,
then fully retired** after repeated GPU-context-loss failures on macOS (dual-GPU
switching killed the WebGL context unpredictably; see commit history on `v3` for the
debugging trail). The hero shipped today has **no WebGL, no Three.js, no React Three
Fiber** — those packages are still in `package.json` but are dead weight (only
referenced in a stale comment in `seed-data.ts`); removing them is a good first cleanup
task for whoever picks this up.

**What ships instead — desktop (full-motion, ≥1025px):**
- Three plain PNG layers (`hero-l1-sky.png`, `hero-l2-figures.png`,
  `hero-l3-flora.png`, in `public/assets/hero/`) composited with `object-fit: cover`,
  animated with pure CSS transforms — no canvas, no GPU context to lose, nothing
  competing with scroll for the compositor thread:
  - Whole scene: slow ken-burns drift (24s, alternating).
  - Figures layer: bottom-anchored `scaleY` breathing (1.6% amplitude, 6.4s).
  - Flora layer: bottom-anchored skew + horizontal drift, ±1.5°, 5s loop — the grass
    sway.
  - A CSS radial-gradient "glow" div positioned over the developer's laptop screen,
    pulsing opacity + scale (4s) to read as warm screen light.
- A pinned scroll journey (GSAP ScrollTrigger, `scrub: true`) 440vh tall: the belief
  line fades in first, then four narrative beats crossfade in place over the same
  static scene as the visitor scrolls. Text does not move with the scene — only
  opacity/small y-drift on the copy.
- **At the end of the journey** the whole pinned scene fades out *in place* (not scroll-
  away) over the last 10% of the pin, and the first section below (`Problem`) is pulled
  up ~76vh with trimmed top padding so it rises into view as the hero dissolves — this
  closes what was originally a full-viewport dead-scroll gap after the pin released.
  See `src/components/hero/Hero.tsx` + `.afterHero` in `Sections.module.css`.
- **Text legibility:** a soft two-pool radial "paper scrim" behind the copy
  (`.textScrim`) plus a tight paper text-shadow halo on the letters — belt-and-braces so
  ink never sinks into a dark patch of the artwork (a figure, the laptop). This was
  added after the mono rebrand (dark ink on the new light system needed active
  separation it didn't need against the old dark Midnight background).

**Phone + iPad (≤1024px, `useIsDesktop` false):**
- **No motion at all**, by explicit direction — not a fallback, a decision.
- **No pinned journey, no beats.** The hero is a single `100svh` screen: belief line +
  subline over the shared background (see below). The four narrative beat lines
  ("You live inside software all day…") that play out during the desktop scroll journey
  currently **do not appear anywhere on mobile** — that copy is silently dropped. Flagged
  as an open gap in §9; worth a product call on whether to show them as a static
  stacked block under the hero.
- **Background:** the hero paints *no image of its own*. `WorldBackground` (see §5)
  supplies one fixed, cover-fitted, device-specific image — `hero-phone.jpg` (853×1844,
  portrait) on phone, `hero-ipad.jpg` (1086×1448, portrait) on iPad — behind the entire
  page, hero included. This was a deliberate fix for a previous crop mismatch / tiling
  seam between a desktop-cropped hero image and a separate tiled section background.
- Reduced-motion desktop also falls back to a still frame
  (`hero-static.webp`)/(`hero-mobile.webp` was the old phone still, now unused —
  superseded by `hero-phone.jpg`; safe to delete once confirmed unused).

## 5. The world background — one fixed stage behind every section

`src/components/motion/WorldBackground.tsx`, mounted once at the top of the page
(`src/app/(site)/page.tsx`), fixed behind hero + every section:

- **Desktop:** a sky plate (parallax drift, `translate3d` tied to scroll) + a flora band
  pinned to the viewport bottom that "ebbs" (opacity + drift, `sin(progress * π * 3.2)`)
  as you scroll, plus a scroll-driven paper scrim for legibility. `ScrollTrigger` scrub
  `0.25`. Nothing scrolls away — content scrolls *over* a background that stays put and
  evolves in place.
- **Phone/iPad:** the shared device image described in §4, plus a static linear-gradient
  paper scrim (heavier toward the bottom) for legibility over the scrolling sections. No
  scroll-driven motion at all on these devices.
- Governed by `useMotionTier()` (full/reduced/static — reduced-motion media query,
  `navigator.deviceMemory`, `saveData`) and `useIsDesktop()`
  (`min-width: 1025px`) in `src/lib/capability.ts`.

## 6. The trail spine

`src/components/motion/TrailSpine.tsx` — desktop + full-motion only. A thin ink line
drawn through `[data-trail]` anchors on each section (left/center/right), with a glowing
comet advancing along it. Two things worth knowing if you touch this:

- The comet's position is **glued to the viewport center**, not to arc-length scroll
  fraction — it binary-searches the path for the point whose document-Y equals
  `scrollY + viewport-height/2` every scroll frame. (An earlier version drove it by
  scroll-fraction × path-length, which drifted noticeably off-center because the path
  weaves and section gaps aren't uniform — only converging correctly right at the very
  end.) If you add/reorder `[data-trail]` anchors, this still holds because it's
  Y-position-based, not index-based.
- No trail on mobile/tablet or reduced-motion — dropped entirely, not simplified.

## 7. Scroll feel

`src/components/motion/LenisProvider.tsx` wraps the page in Lenis, ticked through GSAP's
own clock so `ScrollTrigger` and Lenis agree on one timeline. Tuned lerp `0.24` (higher =
snappier/less "dragged" feel — this was raised twice in response to feedback that the
default felt floaty/imprecise). `scrollRestoration: 'manual'` + forced `scrollTo(0,0)` on
load, because the tall pinned hero otherwise gets the browser's natural scroll
restoration wrong (lands mid-page or at the very bottom before ScrollTrigger has
measured). Skipped entirely at reduced-motion.

## 8. Information architecture (unchanged from original intent)

```
Hero → Problem (+ stats band) → What We Build → Labs & Innovation (= proof)
  → CTA / short quiz → About (+ contact) → Footer
```

- Sub-destinations, out of this site: `labs.isocodelabs.com`, `creator.isocodelabs.com`,
  each product's own site (CVBuddy, ClearQuote, LifeTreeOS, Meddesk).
- Explicitly out of scope: case studies/client logos, any "how we work" process
  section, pricing, blog, client portal, investor material.
- Routes actually shipped (`src/app/(site)/`):
  - `/` — the one-page composition above.
  - `/quiz` — the short quiz (see §8a). Nav hides on this route; the quiz has its own
    minimal chrome.
  - `/privacy`, `/terms` — `[legal]/page.tsx`, dynamic slug against `legalStubs` seed +
    CMS `Pages` collection.
  - `/design` — a living style-guide/token preview page (not public-facing product,
    useful for the next builder).
  - `/(payload)/admin` — Payload's CMS admin UI.

### 8a. The short quiz

`src/components/quiz/QuizFlow.tsx`. Three phases: `entry → questions → capture`.
- Entry framing, then N image/text-choice questions read from CMS/`seed-data`
  (`shortQuiz`), one at a time, with a step counter.
- Capture phase: name / email / company / optional note → `submitLead` server action
  (`src/app/actions.ts`) → writes a `lead-submissions` doc (kind `shortQuiz`) via
  Payload Local API, server-side only (public `create` access is `noOne` — the DB never
  accepts a direct public write).
- The **long quiz** (pre-onboarding, post-conversion) has CMS collections scaffolded
  (`QuizStages`, `QuizQuestions`, `type: 'long'` on `Quizzes`) but **no frontend route
  exists** — this is schema-ready, not built. Explicitly out of Build 2 scope.

## 9. Content model — Payload CMS with a hard seed fallback

`src/lib/content.ts`: `getSiteContent()` reads every section's copy from Payload's Local
API; if the CMS is empty or unreachable, it falls back to the canonical seed copy in
`src/lib/seed-data.ts` field-by-field, so **the site can never render a blank section**.
Once a field is set in the CMS, the CMS wins for that field.

Collections (`src/collections/`): `Users`, `Media`, `Products`, `Stats`, `Values`,
`ValueQuotes`, `Quizzes` + `QuizStages` + `QuizQuestions`, `LeadSubmissions`, `Pages`.
Globals (`src/globals/`): `SiteSettings`, `Homepage`.

One load-bearing quirk: **`Products` (the Labs cards) store no `image` or
`statusLabel`** — those are resolved client-side from `seed-data.ts` by product slug.
This means editing a product's tagline/name in the CMS is live immediately, but
swapping a product's image or status label requires editing `seed-data.ts` and
redeploying. If a future task wants CMS-editable product images, this is the file to
change (`src/lib/seed-data.ts` + `src/lib/content.ts` product-merge logic).

Dev DB: `embedded-postgres` npm package (no Docker/Homebrew dependency on the dev
machine), started with `npm run dev:db`, port 5502. Seed with
`npm run seed` (uses `tsx --env-file=.env`, **not** `payload run` — that silently dies
partway through `getPayload()` in this project; always use the `tsx` script pattern for
one-off scripts against the CMS).

## 10. Assets inventory

```
public/assets/
  brand/   il-monogram-{black,white}.png (nav+footer mark)
           isocodelabs-wordmark-{color,mono}.{jpg,png} — mono one is UNUSED,
             wordmark renders in Anton text, not an image
  hero/    hero-l1-sky.png, hero-l2-figures.png, hero-l3-flora.png (desktop layers)
           hero-static.webp (reduced-motion desktop fallback)
           hero-phone.jpg (853×1844), hero-ipad.jpg (1086×1448) — shared page bg,
             not hero-only, on those devices
           hero-mobile.webp — superseded by hero-phone.jpg, likely deletable
  sections/section-bg-sky.png, section-flora-edges.png — still live, used by
             WorldBackground's desktop sky/flora plates (WorldBackground.module.css)
  labs/    labs-{cvbuddy,clearquote,lifetreeos,meddesk}.png — product card art
```

Known placeholders still in production, carried over from Build 1/2 and not yet
resolved:
- `public/og.png` is a Build-1 placeholder OG image — needs a real one before this is
  treated as launch-ready for link previews.
- Quiz option imagery ("mood tiles") — check current `shortQuiz` seed data; some
  options may still be using placeholder art per Build 2 notes.

## 11. Motion, performance & accessibility rules to preserve

- `prefers-reduced-motion: reduce` → `useMotionTier()` returns `'static'`, which turns
  off: Lenis, TrailSpine, WorldBackground's scroll-driven updates, the hero's pinned
  journey and all CSS keyframe animations (media-query-gated in each `.module.css`).
  Any new animated component must check this the same way, not invent its own gate.
- `useIsDesktop()` (`min-width: 1025px`) is the line between "full immersive treatment"
  and "still/no-motion." Respect it for any new hero-adjacent or trail-adjacent work —
  don't build a third breakpoint without a reason.
- The dev sandbox this was built in has **no GPU**, so any WebGL-dependent feature is
  fundamentally unverifiable there — this is *why* the hero moved off WebGL entirely,
  and it's a strong argument against reintroducing a GPU dependency for a marketing
  page. If a future task wants richer motion, prefer more CSS/SVG tricks over reaching
  back for Three.js/WebGL, given the macOS context-loss history.
- `reactStrictMode: false` is set in `next.config.mjs`. This was necessary while the
  hero used WebGL (Strict Mode's dev double-mount was destroying the GPU context on
  mount #1's cleanup). It's dead weight now that the hero is pure CSS/DOM — worth
  re-enabling Strict Mode and confirming nothing regresses, since Strict Mode's extra
  dev-only checks are useful safety net that's currently switched off site-wide.

## 12. Versioning & workflow (for whoever continues this)

- Repo: `github.com/CeasaKK/ICLabs-Main`. Three branches map to three unrelated
  brand builds — never mix them: `old` = tag `v1.0.0`, `main` = tag `v2.0.0`, `v3`
  (orphan history) = tags `v3.x.x`. **All current/future work happens on `v3`.**
  Promoting `v3` → `main` is a deliberate, human call, not automatic.
  See [[isocodelabs-v3-project]] memory entry.
- Every change gets committed, version-tagged (patch bump `v3.1.x` by default; minor
  bump for a real milestone), and pushed to `origin/v3` — no separate confirmation
  needed for this. Current tag at time of writing: **v3.1.0**.
- Prod target (not yet deployed): GCP Cloud Run + Cloud SQL, per earlier planning —
  confirm this is still the plan before building deploy tooling.

## 13. Open items for the next build phase

Ranked roughly by how load-bearing they are:

1. **Mobile hero beats copy is silently dropped** (§4) — the narrative ("you live
   inside software all day / most of it is forgettable / we build the other kind")
   only exists on desktop. Needs a product decision: show as static text on mobile, or
   accept it as desktop-only.
2. ~~**`three` / `@react-three/fiber` are dead dependencies**~~ — **done in v3.1.2**:
   removed from `package.json` (zero code references; no visual/functional change).
3. ~~**`reactStrictMode: false`**~~ — **done in v3.1.2**: re-enabled (`true`); verified
   no regression now that the WebGL context-churn reason is gone.
4. **Long quiz has schema but no route** — `QuizStages`/`QuizQuestions` collections
   exist; the pre-onboarding flow itself was explicitly out of Build 2 and still needs
   building if it's on the roadmap.
5. **`public/og.png` placeholder** and possibly some quiz option art — confirm current
   state and replace before treating the site as launch-ready.
6. **`hero-mobile.webp` is confirmed orphaned** (no references anywhere in `src/`) —
   safe to delete. The `sections/` assets are still live (desktop
   `WorldBackground.module.css`), not orphaned — leave them.
7. **Client Portal, long quiz, multi-page marketing routes** remain fully out of scope,
   as originally specified — re-confirm this is still true before assuming this PRD's
   IA is complete for a next phase.
