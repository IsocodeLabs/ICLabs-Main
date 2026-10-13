import { getPayload } from 'payload'
import config from '@payload-config'
import {
  aboutContent,
  aboutPageContent,
  contactChannels,
  ctaContent,
  footerContent,
  foundersContent,
  heroContent,
  labsContent,
  problemContent,
  shortQuiz,
  siteSEO,
  statsContent,
  valueQuotes,
  valuesContent,
  whatWeBuildContent,
} from './seed-data'

/**
 * Content access with grace: read from Payload (Local API); if the CMS is
 * empty or unreachable, render the canonical seed copy so the site never
 * ships a blank page. Once seeded, the CMS wins.
 */

export type SiteContent = {
  hero: typeof heroContent
  problem: typeof problemContent
  stats: typeof statsContent
  whatWeBuild: typeof whatWeBuildContent
  labs: typeof labsContent
  cta: typeof ctaContent
  about: typeof aboutContent
  values: typeof valuesContent
  quotes: string[]
  footer: typeof footerContent
  contact: typeof contactChannels
  seo: typeof siteSEO
  founders: Founder[]
}

/** CMS founder docs → render shape, falling back per-field to the seed deck. */
function toFounders(
  docs: Array<{
    name: string
    title?: string | null
    photo?: unknown
    eduLine?: string | null
    socials?: Array<{ platform: string; url?: string | null }> | null
  }>,
  fallback: Founder[],
): Founder[] {
  if (docs.length === 0) return fallback
  return docs.map((f, i) => {
    const cmsSocials = (f.socials ?? [])
      .filter((s) => Boolean(s.url))
      .map((s) => ({ platform: s.platform, url: s.url as string }))
    // a founder with no profile links set in the CMS keeps the ones in the deck
    const seeded = fallback.find((d) => d.name.toLowerCase() === f.name.toLowerCase())
    return {
      name: f.name,
      title: f.title ?? 'Co-founder',
      photo: mediaURL(f.photo, fallback[i % fallback.length]?.photo ?? ''),
      eduLine: f.eduLine ?? '',
      socials: cmsSocials.length > 0 ? cmsSocials : (seeded?.socials ?? []),
    }
  })
}

/**
 * The footer always carries a Careers link, even when the CMS's nav list
 * predates it: it's slotted in before Contact (or last), taken from the seed.
 */
function withCareersLink(
  links: Array<{ label: string; href: string }>,
  seed: Array<{ label: string; href: string }>,
) {
  if (links.some((l) => /careers/i.test(l.href) || /^careers$/i.test(l.label))) return links
  const careers = seed.find((l) => /careers/i.test(l.href))
  if (!careers) return links
  const at = links.findIndex((l) => /contact/i.test(l.label))
  return at === -1 ? [...links, careers] : [...links.slice(0, at), careers, ...links.slice(at)]
}

const mediaURL = (img: unknown, fallback: string): string => {
  if (img && typeof img === 'object' && 'url' in img && typeof img.url === 'string') {
    return img.url
  }
  return fallback
}

export async function getSiteContent(): Promise<SiteContent> {
  const fallback: SiteContent = {
    hero: heroContent,
    problem: problemContent,
    stats: statsContent,
    whatWeBuild: whatWeBuildContent,
    labs: labsContent,
    cta: ctaContent,
    about: aboutContent,
    values: valuesContent,
    quotes: valueQuotes,
    footer: footerContent,
    contact: contactChannels,
    seo: siteSEO,
    founders: foundersContent,
  }

  try {
    const payload = await getPayload({ config })
    const [home, settings, products, stats, values, quotes, founders] = await Promise.all([
      payload.findGlobal({ slug: 'homepage' }),
      payload.findGlobal({ slug: 'site-settings' }),
      payload.find({
        collection: 'products',
        where: { showOnSite: { equals: true } },
        sort: 'order',
        depth: 1,
        limit: 20,
      }),
      payload.find({ collection: 'stats', sort: 'order', limit: 12 }),
      payload.find({ collection: 'values', sort: 'order', limit: 12 }),
      payload.find({
        collection: 'value-quotes',
        where: { active: { equals: true } },
        sort: 'order',
        limit: 50,
      }),
      payload.find({ collection: 'founders', sort: 'order', depth: 1, limit: 12 }),
    ])

    const seeded = Boolean(home?.hero?.beliefLine)
    if (!seeded) return fallback

    return {
      hero: {
        beliefLine: home.hero?.beliefLine ?? fallback.hero.beliefLine,
        subline: home.hero?.subline ?? fallback.hero.subline,
        scrollBeats:
          home.hero?.scrollBeats?.map((b: { text: string }) => b.text) ??
          fallback.hero.scrollBeats,
        primaryCta: fallback.hero.primaryCta,
      },
      problem: {
        narrative:
          home.problem?.narrative?.map((p: { text: string }) => p.text) ??
          fallback.problem.narrative,
      },
      stats:
        stats.docs.length > 0
          ? stats.docs.map((s) => ({
              value: s.value,
              label: s.label,
              source: s.source,
              sourceNote: s.sourceNote ?? '',
            }))
          : fallback.stats,
      whatWeBuild: {
        heading: home.whatWeBuild?.heading ?? fallback.whatWeBuild.heading,
        body:
          home.whatWeBuild?.body?.map((p: { text: string }) => p.text) ??
          fallback.whatWeBuild.body,
        items: fallback.whatWeBuild.items,
      },
      labs: {
        beliefBeat: home.labsIntro?.beliefBeat ?? fallback.labs.beliefBeat,
        heading: home.labsIntro?.heading ?? fallback.labs.heading,
        body: home.labsIntro?.body ?? fallback.labs.body,
        products:
          products.docs.length > 0
            ? products.docs.map((p, i) => ({
                name: p.name,
                slug: p.slug,
                blurb: p.blurb,
                status: p.status,
                statusLabel:
                  fallback.labs.products.find((f) => f.slug === p.slug)?.statusLabel ??
                  p.status,
                badge: p.badge ?? 'from ISOCODELABS',
                // link targets live in code (like image + status): a launched
                // product's address changes here, not in a stale CMS row
                outboundURL:
                  fallback.labs.products.find((f) => f.slug === p.slug)?.outboundURL ??
                  p.outboundURL ??
                  '#',
                image: mediaURL(
                  p.previewImage,
                  fallback.labs.products.find((f) => f.slug === p.slug)?.image ??
                    fallback.labs.products[i % 4].image,
                ),
                order: p.order ?? i,
              }))
            : fallback.labs.products,
      },
      cta: {
        heading: home.cta?.heading ?? fallback.cta.heading,
        body: home.cta?.body ?? fallback.cta.body,
        quizLabel: home.cta?.quizLabel ?? fallback.cta.quizLabel,
        hatchLabel: home.cta?.hatchLabel ?? fallback.cta.hatchLabel,
        stepsLabel: fallback.cta.stepsLabel,
        steps: fallback.cta.steps,
      },
      about: {
        heading: home.about?.heading ?? fallback.about.heading,
        body: home.about?.body?.map((p: { text: string }) => p.text) ?? fallback.about.body,
        teamLine: home.about?.teamLine ?? fallback.about.teamLine,
        contactHeading: home.about?.contactHeading ?? fallback.about.contactHeading,
        moreLink: fallback.about.moreLink,
      },
      values:
        values.docs.length > 0
          ? values.docs.map((v, i) => ({
              title: v.title,
              description: v.description,
              order: v.order ?? i,
            }))
          : fallback.values,
      quotes: quotes.docs.length > 0 ? quotes.docs.map((q) => q.quote) : fallback.quotes,
      footer: {
        beliefLine: settings?.footer?.beliefLine ?? fallback.footer.beliefLine,
        navLinks: withCareersLink(
          settings?.footer?.navLinks
            // the creator program is retired — drop it even if the CMS still has the link
            ?.filter((l: { href: string }) => !/creator/i.test(l.href))
            .map((l: { label: string; href: string }) => ({
              label: l.label,
              href: l.href,
            })) ?? fallback.footer.navLinks,
          fallback.footer.navLinks,
        ),
        legalLinks:
          settings?.footer?.legalLinks?.map((l: { label: string; href: string }) => ({
            label: l.label,
            href: l.href,
          })) ?? fallback.footer.legalLinks,
        copyright: settings?.footer?.copyright ?? fallback.footer.copyright,
        hiring: fallback.footer.hiring,
      },
      contact: {
        email: settings?.contactChannels?.email ?? fallback.contact.email,
        phone: settings?.contactChannels?.phone ?? fallback.contact.phone,
      },
      seo: {
        metaTitle: settings?.defaultSEO?.metaTitle ?? fallback.seo.metaTitle,
        metaDescription: settings?.defaultSEO?.metaDescription ?? fallback.seo.metaDescription,
      },
      founders: toFounders(founders.docs, fallback.founders),
    }
  } catch {
    return fallback
  }
}

export type Founder = {
  name: string
  title: string
  photo: string
  eduLine: string
  socials: Array<{ platform: string; url: string }>
}

export type AboutPageContent = {
  page: typeof aboutPageContent
  values: typeof valuesContent
  founders: Founder[]
  contact: typeof contactChannels
}

/**
 * The standalone /about page. Reads founders + values + about copy from the CMS,
 * falling back field-by-field to seed so it never renders blank. Founders' socials
 * only surface once a URL is set (added via CMS later).
 */
export async function getAboutPageContent(): Promise<AboutPageContent> {
  const fallback: AboutPageContent = {
    page: aboutPageContent,
    values: valuesContent,
    founders: foundersContent,
    contact: contactChannels,
  }

  try {
    const payload = await getPayload({ config })
    const [values, founders, settings] = await Promise.all([
      payload.find({ collection: 'values', sort: 'order', limit: 12 }),
      payload.find({ collection: 'founders', sort: 'order', depth: 1, limit: 12 }),
      payload.findGlobal({ slug: 'site-settings' }),
    ])

    return {
      page: aboutPageContent,
      values:
        values.docs.length > 0
          ? values.docs.map((v, i) => ({
              title: v.title,
              description: v.description,
              order: v.order ?? i,
            }))
          : fallback.values,
      founders: toFounders(founders.docs, fallback.founders),
      contact: {
        email: settings?.contactChannels?.email ?? fallback.contact.email,
        phone: settings?.contactChannels?.phone ?? fallback.contact.phone,
      },
    }
  } catch {
    return fallback
  }
}

export type QuizContent = typeof shortQuiz

export async function getShortQuiz(): Promise<QuizContent> {
  try {
    const payload = await getPayload({ config })
    const quizzes = await payload.find({
      collection: 'quizzes',
      where: { and: [{ type: { equals: 'short' } }, { active: { equals: true } }] },
      limit: 1,
    })
    const quiz = quizzes.docs[0]
    if (!quiz) return shortQuiz

    const questions = await payload.find({
      collection: 'quiz-questions',
      where: { quiz: { equals: quiz.id } },
      sort: 'order',
      depth: 1,
      limit: 40,
    })
    if (questions.docs.length === 0) return shortQuiz

    return {
      name: quiz.name,
      type: 'short',
      entryHeading: quiz.entryHeading ?? shortQuiz.entryHeading,
      entryCopy: quiz.entryCopy ?? shortQuiz.entryCopy,
      closeHeading: quiz.closeHeading ?? shortQuiz.closeHeading,
      closeCopy: quiz.closeCopy ?? shortQuiz.closeCopy,
      questions: questions.docs.map((q, qi) => ({
        order: q.order ?? qi + 1,
        type: (q.type ?? 'tap') as 'tap' | 'image',
        prompt: q.prompt,
        helperText: q.helperText ?? '',
        signalKey: q.signalKey ?? 'none',
        options: (q.options ?? []).map(
          (o: { label: string; value: string; image?: unknown }, oi: number) => ({
            label: o.label,
            value: o.value,
            image: mediaURL(
              o.image,
              (shortQuiz.questions[qi]?.options[oi] as { image?: string })?.image ?? '',
            ),
          }),
        ),
      })),
    }
  } catch {
    return shortQuiz
  }
}
