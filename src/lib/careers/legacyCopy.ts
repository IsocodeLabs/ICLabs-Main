import type { JobOpening } from '@/payload-types'
import { careerRoles } from '@/lib/seed-data'

/**
 * Role copy the CMS was first seeded with (Oct 2026, before the public-copy
 * fixes). Production rows still hold it until someone edits them in the admin,
 * and the CMS wins over seed copy — so the old pay terms (target, deal count,
 * commission %) and the specific job descriptions would go public again.
 *
 * upgradeStaleRoleCopy() runs on every read of a role (collection afterRead
 * hook — site, REST/GraphQL API and admin alike): a field that still equals its
 * originally-seeded value exactly is swapped for the current seed copy. Anything
 * a founder has edited is left alone. Saving a role in the admin persists the
 * upgraded text; once all three are saved, this file can go.
 */
type CopyField = 'title' | 'payLine' | 'blurb' | 'about' | 'compensation' | 'responsibilities' | 'lookingFor'
type LegacyCopy = Record<string, Partial<Record<CopyField, string | string[] | null>>>

const LEGACY: LegacyCopy = {
  "swe-intern": {
    "payLine": "₹50,000/month",
    "blurb": "Build production software to a craft bar most places only talk about — and have it reviewed like it matters.",
    "about": "You will build the software we take on for our clients, from the first screen to production. Real projects, real users, and every pull request reviewed like it matters.",
    "compensation": "₹50,000 per month, fixed.",
    "responsibilities": [
      "Build client projects end to end: frontend, backend and deployment",
      "Work from PRDs written by our product team, alongside the founders",
      "Ship to production and own what you ship"
    ],
    "lookingFor": [
      "Things you have actually built and shipped, with links",
      "Clean, readable code and good judgement about trade offs",
      "You use AI tools well and still understand every line you ship"
    ]
  },
  "product-manager-intern": {
    "title": "Product Manager Intern",
    "payLine": "₹50,000/month",
    "blurb": "Turn what a client says into software our engineers can build.",
    "about": "You will sit between our clients and our engineers. You take a client’s requirements, turn them into a clear product spec, and see the project through to delivery. You also design and spec the internal tools we build for ourselves.",
    "compensation": "₹50,000 per month, fixed.",
    "responsibilities": [
      "Run requirement discussions with onboarded clients and write the PRD for each project",
      "Own around 3 client projects a month alongside our engineers: scope, priorities, timelines and changes",
      "Write PRDs and create mockups for our internal tools and products",
      "Keep every client clear on what is being built and when"
    ],
    "lookingFor": [
      "You understand software deeply enough to write a spec an engineer can build from without guessing",
      "You can turn a messy request into a clear scope, and say no to the rest",
      "You can produce clean mockups (Figma or similar)",
      "You write clearly and keep many threads organised"
    ]
  },
  "business-growth-intern": {
    "title": "Business Growth Intern",
    "payLine": "₹1,00,000/month at target + 20% commission beyond",
    "blurb": "Find the businesses that need what we build, and bring them on board.",
    "about": "You will own our pipeline in one industry, from the first call to an agreed price. We hand you a detailed proposal for the software we are taking to that industry. You find the right companies, start the conversation, and bring them to the table. The founders join you at the final meeting to sign.",
    "compensation": "₹1,00,000 per month on reaching the monthly target of 3 closed deals, plus 20% commission on every deal beyond that. Full terms, including pay below target, are shared with shortlisted candidates before any offer.",
    "responsibilities": [
      "Study the proposal document for your assigned industry until you can pitch it cold",
      "Find and qualify leads yourself",
      "Reach out by phone, email, WhatsApp and LinkedIn",
      "Run discovery calls and take serious leads to an agreed price (projects start at ₹1.2 lakh)",
      "Hand the client over to the founders at the final meeting for signing"
    ],
    "lookingFor": [
      "You are comfortable calling people you have never met",
      "You understand software products well enough to explain one to a business owner in plain words",
      "You follow up relentlessly and keep your pipeline organised",
      "Bonus: you have sold, pitched or launched something before"
    ]
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

export function upgradeStaleRoleCopy<T extends Partial<JobOpening>>(doc: T): T {
  if (!doc?.roleKey) return doc
  const legacy = LEGACY[doc.roleKey]
  const seed = careerRoles.find((r) => r.roleKey === doc.roleKey)
  if (!legacy || !seed) return doc
  const out = { ...doc } as Record<string, unknown>
  for (const field of Object.keys(legacy) as CopyField[]) {
    const current = out[field]
    if (current === undefined) continue // field not selected in this read
    if (field === 'responsibilities' || field === 'lookingFor') {
      const texts = Array.isArray(current) ? current.map((r: { text?: string | null }) => r?.text ?? '') : current
      if (same(texts, legacy[field])) out[field] = seed[field].map((text) => ({ text }))
    } else if (same(current, legacy[field])) {
      out[field] = seed[field]
    }
  }
  return out as T
}
