# Careers PRD v3: copy changes (old → new)

**Branch:** `feat/careers-job-pages`. "Old" is what v2 rendered; "new" is what v3 renders.

All copy lives in `src/lib/seed-data.ts` (`careersContent` and `careerRoles`). Role copy reaches the CMS through `npm run careers:migrate`, which rewrites each role's copy once (copy version 2 → 3). It never touches role status or caps.

Apostrophes render typographically (’), matching the rest of the site. Headings, eyebrows and the "Our standard" line are upper-cased by CSS (design system). The source strings are sentence case as written.

## Main careers page

| Slot | Old | New |
|---|---|---|
| Page title | Careers — ISOCODELABS | Careers \| ISOCODELABS |
| Meta description | Isocode is hiring remote interns in business growth, product, and engineering, plus an always open application. | ISOCODELABS is hiring across 3 roles. Remote. 6 months. Stipends up to ₹1,00,000/month. |
| OG title | Careers — ISOCODELABS | We’re hiring at ISOCODELABS. |
| OG description | *(same as meta description)* | 3 roles. Remote. 6 months. Stipends up to ₹1,00,000/month. |
| Hero eyebrow | Careers | *(unchanged)* |
| Hero H1 | For the few who’d rather build things properly. | We’re hiring. |
| Hero sub | Isocode is a small, senior studio held to a single bar — craft. If “good enough” has never once sat right with you, this is where that instinct is the job, not a liability. | We’re growing fast, and we’re building the team that takes us to the next stage. 3 roles. Remote. 6 months. |
| Hero CTA | See open roles → | *(unchanged)* |
| Roles eyebrow | Open roles | *(unchanged)* |
| Roles H2 | Where we’re hiring. | 3 roles. One standard. |
| Roles sub | Remote internships, six months each. We hire the person first, then shape the role around them. | Read the role. Apply in two minutes. |
| Availability note | *(none)* | Limited openings. Applications reviewed on a rolling basis. |
| Card: type label | Internship | *(removed; not in the v3 card spec)* |
| Card CTA | Apply → *(linked to the job page's form)* | View role → *(the whole card opens the job page)* |
| Open Application eyebrow | Open application | *(removed; v3 lists only H3, body and CTA, and the form below now carries that eyebrow)* |
| Open Application H3 | Don’t see your role? | *(unchanged)* |
| Open Application body | If you are exceptional at something we haven’t listed, tell us. Every open application is read by a founder. | If you’re exceptional at what you do, we want to hear from you. |
| Open Application CTA | Send an open application → | *(unchanged)* |
| The bar H2 | What we hire for. | We work by one rule. |
| The bar body | Two paragraphs: "We are not hiring seat-fillers…" and "The team stays small on purpose…" | Good enough is never the standard. |
| The bar principles | Craft over credentials / Ownership, not tickets / Remote, senior, quiet (with their bodies) | *(removed; slot hidden)* |
| Apply eyebrow | Apply | Open application |
| Apply H2 | Tell us who you are. | Tell us what you’re exceptional at. |
| Apply sub | Round 1 is short: your CV and a few basic details. | Two minutes. If there’s a fit, we’ll email you. |
| Role dropdown | Business Growth / Product Manager / Software Engineering / Open application | *(removed; this form is open application only)* |
| Privacy line | Everything here stays private — read only by the founders, never sold or shared. *(CMS Application Form intro; production may hold an older variant)* | Everything here stays private. Read only by our team. |
| Submit button | Submit application | Apply |
| Success | "Application received." plus "Thanks, your application is in. If you’re shortlisted, we’ll email you the next steps." | You’re in. If there’s a fit, we’ll email you. |
| Duplicate | You’ve already applied for this role. Write to us if you need to update your CV. | You’ve already sent an open application. |

### Role cards

| Card | Field | Old | New |
|---|---|---|---|
| Business Growth Intern | Meta row | 6 months · ₹1,00,000/month at target + 20% commission beyond · Remote | Growth · Remote · 6 months |
| | One-liner | Find the businesses that need what we build, and bring them on board. | For people who can sell software and think in products. |
| | Pay line | *(was inside the meta row)* | Up to ₹1,00,000/month, plus uncapped commission |
| Software Engineering Intern | Meta row | 6 months · ₹50,000/month · Remote | Engineering · Remote · 6 months |
| | One-liner | Build production software to a craft bar most places only talk about — and have it reviewed like it matters. | For people who build and ship software end to end. |
| | Pay line | *(was inside the meta row)* | ₹50,000/month |
| Product Management Intern | Title | Product Manager Intern | Product Management Intern |
| | Meta row | 6 months · ₹50,000/month · Remote | Product · Remote · 6 months |
| | One-liner | Turn what a client says into software our engineers can build. | For people who understand software and AI products deeply. |
| | Pay line | *(was inside the meta row)* | ₹50,000/month |
| *(order)* | | Business Growth, Product Manager, Software Engineering | Business Growth, Software Engineering, Product Management |

## Job pages: shared blocks

| Slot | Old | New |
|---|---|---|
| Top crumb | ← All roles | *(removed; FR2 header has no crumb, and the back link stays at the bottom)* |
| Eyebrow | {Department} · Careers | Per role, e.g. "Growth · Remote · 6 months" |
| Header tagline | *(the card one-liner)* | *(removed; not in the FR2 header)* |
| Key facts | Labelled list: Type / Location / Duration / Pay | Strip: Remote · 6 months · {stipend} |
| Availability note | *(none)* | Limited openings. Applications reviewed on a rolling basis. |
| Header CTA | Apply for this role → | Apply for this role ↓ |
| About ISOCODELABS | *(none)* | ISOCODELABS is a software studio that designs and builds premium software for growing businesses. We’re a small team that holds every piece of work to one standard, and we’re growing fast. |
| Section titles | About the role / What you’ll do / What we look for / What you’ll work with / Compensation / Hiring process | The role / What you’ll do / What you bring / Nice to have / Role details / How we hire / Our standard |
| Compensation section | Per-role compensation text plus footnote | *(removed; pay appears in Role details → Stipend, and Start replaces the footnote)* |
| Our standard | *(none)* | We work by one rule: good enough is never the standard. |
| Apply H2 | Apply: {role title} | Apply for this role |
| Apply sub | Round 1 is short: your CV and a few basic details. | Two minutes. Just your CV and a few details. Applications are reviewed on a rolling basis, and if you’re shortlisted, we’ll email you the next steps. |
| Privacy line | *(CMS intro, as above)* | Everything here stays private. Read only by our team. |
| Submit button | Submit application | Apply |
| Success | "Application received." plus "Thanks, your application is in. If you’re shortlisted, we’ll email you the next steps." | You’re in. If you’re shortlisted, we’ll email you the next steps. |
| Duplicate | You’ve already applied for this role. Write to us if you need to update your CV. | You’ve already applied for this role. |
| Paused message | Applications are paused. Check back soon. | Applications for this role are paused. Check back soon. |
| Paused extra link | Or send an open application → | *(removed; not in v3)* |
| Back link | ← Back to all roles | ← All open roles |
| Mobile sticky button | *(none)* | Apply |
| JSON-LD hiringOrganization | Isocode Labs | ISOCODELABS |
| JSON-LD description | HTML: about + lists + compensation text | Plain text: The role + What you’ll do + What you bring |

## Job pages: per role

Every role's body copy was replaced wholesale. The new text is exactly PRD v3 §5. The old v2 text is listed here for the record.

### Business Growth Intern (`/roles/business-growth-intern`)

| Slot | Old | New |
|---|---|---|
| Page title | Business Growth Intern — Careers — ISOCODELABS | Business Growth Intern \| ISOCODELABS Careers |
| Meta description | Find the businesses that need what we build, and bring them on board. Internship · 6 months, Remote. | Remote, 6 months. Stipend up to ₹1,00,000/month, plus uncapped commission. |
| OG title / description | Business Growth Intern — ISOCODELABS Careers / *(same as meta description)* | Business Growth Intern at ISOCODELABS / Remote. 6 months. Up to ₹1,00,000/month, plus uncapped commission. |
| Key facts pay | ₹1,00,000/month at target + 20% commission beyond | Up to ₹1,00,000/month + uncapped commission |
| The role | You will own our pipeline in one industry, from the first call to an agreed price. We hand you a detailed proposal… The founders join you at the final meeting to sign. | §5.1 "The role" |
| What you’ll do | Study the proposal document for your assigned industry… / Find and qualify leads yourself / Reach out by phone, email, WhatsApp and LinkedIn / Run discovery calls… (projects start at ₹1.2 lakh) / Hand the client over to the founders… | §5.1, 5 bullets |
| What you bring | You are comfortable calling people you have never met / You understand software products well enough… / You follow up relentlessly… / Bonus: you have sold, pitched or launched something before | §5.1, 4 bullets |
| Nice to have | *(none)* | §5.1, 3 bullets |
| Compensation | ₹1,00,000 per month on reaching the monthly target of 3 closed deals, plus 20% commission on every deal beyond that. Full terms, including pay below target, are shared with shortlisted candidates before any offer. | *(removed; Stipend row:)* Up to ₹1,00,000/month, plus uncapped commission |
| Start | *(none)* | Confirmed at the offer stage |
| How we hire | Apply (Your CV and a few basic details) / Written round (Shortlisted candidates receive it by email) / Interview / Founder interview | Apply (Your CV and a few details) / Assessment (A short task, sent to shortlisted candidates) / Interview / Founder conversation |

### Software Engineering Intern (`/roles/software-engineering-intern`)

| Slot | Old | New |
|---|---|---|
| Page title | Software Engineering Intern — Careers — ISOCODELABS | Software Engineering Intern \| ISOCODELABS Careers |
| Meta description | Build production software to a craft bar… Internship · 6 months, Remote. | Remote, 6 months. ₹50,000/month. Build and ship software end to end. |
| OG title / description | Software Engineering Intern — ISOCODELABS Careers / *(same as meta description)* | Software Engineering Intern at ISOCODELABS / Remote. 6 months. ₹50,000/month. |
| The role | You will build the software we take on for our clients, from the first screen to production. Real projects, real users, and every pull request reviewed like it matters. | §5.2 "The role" |
| What you’ll do | Build client projects end to end: frontend, backend and deployment / Work from PRDs written by our product team, alongside the founders / Ship to production and own what you ship | §5.2, 5 bullets |
| What you bring | Things you have actually built and shipped, with links / Clean, readable code and good judgement about trade offs / You use AI tools well and still understand every line you ship | §5.2, 4 bullets |
| What you’ll work with | Next.js, React, TypeScript, Node.js, Python, FastAPI, AWS, Docker | *(removed; not in v3)* |
| Nice to have | *(none)* | Experience building and shipping software end to end |
| Compensation + footnote | ₹50,000 per month, fixed. / Start dates are confirmed at the offer stage. | *(Stipend row:)* ₹50,000/month · *(Start row:)* Confirmed at the offer stage |
| How we hire | Apply (Send us your CV) / Technical interview / Build test (Build a small piece of software in a fixed time window, AI tools allowed) / HR interview | Apply (Your CV and a few details) / Technical interview / Build challenge (Build something small in a fixed time window) / Final interview |

### Product Management Intern (`/roles/product-manager-intern`; `/roles/product-management-intern` → 308 redirect)

| Slot | Old | New |
|---|---|---|
| Title | Product Manager Intern | Product Management Intern |
| Page title | Product Manager Intern — Careers — ISOCODELABS | Product Management Intern \| ISOCODELABS Careers |
| Meta description | Turn what a client says into software our engineers can build. Internship · 6 months, Remote. | Remote, 6 months. ₹50,000/month. Shape what gets built and how. |
| OG title / description | Product Manager Intern — ISOCODELABS Careers / *(same as meta description)* | Product Management Intern at ISOCODELABS / Remote. 6 months. ₹50,000/month. |
| The role | You will sit between our clients and our engineers… You also design and spec the internal tools we build for ourselves. | §5.3 "The role" |
| What you’ll do | Run requirement discussions with onboarded clients… / Own around 3 client projects a month… / Write PRDs and create mockups for our internal tools and products / Keep every client clear on what is being built and when | §5.3, 5 bullets |
| What you bring | You understand software deeply enough… / You can turn a messy request into a clear scope… / You can produce clean mockups (Figma or similar) / You write clearly and keep many threads organised | §5.3, 4 bullets |
| Nice to have | *(none)* | Technical knowledge of software and AI products |
| Compensation + footnote | ₹50,000 per month, fixed. / Start dates are confirmed at the offer stage. | *(Stipend row:)* ₹50,000/month · *(Start row:)* Confirmed at the offer stage |
| How we hire | Apply (Your CV and a few basic details) / Case assignment (A short PRD and mockup task, sent by email to shortlisted candidates) / Interview / Founder interview | Apply (Your CV and a few details) / Case assignment (A short product task, sent to shortlisted candidates) / Interview / Founder conversation |

## Section 5 items with no exact slot, and how they were placed

- **"Apply: your CV and a few details"** (and the other "Step: description" lines). The stepper has a title slot and a description slot, so these are split into a title ("Apply") and a description, with the description capitalised as a standalone line ("Your CV and a few details").
- **Key facts strip vs Role details "Stipend".** For Business Growth §5 gives two different strings ("…+ uncapped commission" in the strip, "…, plus uncapped commission" in the table). The strip uses a new `stipendShort` field; the card pay line and the Stipend row use `payLine`.
- **FR4 field names.** `roleSummary` maps to the existing `about` field, relabelled "The role (summary)" in the admin. `requirements` maps to the existing `lookingFor`, relabelled "What you bring (requirements)". Both are reused rather than duplicated, so no data moves. Added fields: `eyebrow`, `stipendShort`, `niceToHave`, `startNote`, `seoTitle`, `seoDescription`, `ogTitle`, `ogDescription` and `copyVersion`.
- **The Open Application section's v2 eyebrow** has no v3 slot and was removed.

## Kept as-is (not covered by v3), for your call

- **Form field labels**, including "What would you do at Isocode?" and the consent text "I agree to Isocode using these details…". They say "Isocode", not "ISOCODELABS".
- **The closed-role page**: "This role is closed." and "See open roles →" (v2). The availability note is not shown there.
- **The applicant privacy notice page.** It says CVs are seen by "the founders of Isocode, and no one else", while the new privacy line says "Read only by our team".
- **Nav and back link**: "ISOCODE · CAREERS", "Open roles", "Apply", "isocodelabs.com ↗".
- **Main-site pages outside careers.** The homepage renders "manufacturers" (ClearQuote's one-liner) and statistic percentages (94%, 75%, 88%). None of these are commission percentages, but the acceptance scan of "every public page" would flag "manufacturers" as an industry name.
