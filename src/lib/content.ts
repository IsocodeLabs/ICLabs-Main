import { getPayload } from 'payload'
import config from '@payload-config'
import {
  aboutContent,
  contactChannels,
  ctaContent,
  footerContent,
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
  }

  try {
    const payload = await getPayload({ config })
    const [home, settings, products, stats, values, quotes] = await Promise.all([
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
                outboundURL: p.outboundURL ?? '#',
                image: mediaURL(
                  p.previewImage,
                  fallback.labs.products.find((f) => f.slug === p.slug)?.image ??
                    fallback.labs.products[i % 4].image,
                ),
                order: p.order ?? i,
              }))
            : fallback.labs.products,
        creatorMention: {
          body: home.creatorMention?.body ?? fallback.labs.creatorMention.body,
          href: home.creatorMention?.href ?? fallback.labs.creatorMention.href,
        },
      },
      cta: {
        heading: home.cta?.heading ?? fallback.cta.heading,
        body: home.cta?.body ?? fallback.cta.body,
        quizLabel: home.cta?.quizLabel ?? fallback.cta.quizLabel,
        hatchLabel: home.cta?.hatchLabel ?? fallback.cta.hatchLabel,
      },
      about: {
        heading: home.about?.heading ?? fallback.about.heading,
        body: home.about?.body?.map((p: { text: string }) => p.text) ?? fallback.about.body,
        teamLine: home.about?.teamLine ?? fallback.about.teamLine,
        contactHeading: home.about?.contactHeading ?? fallback.about.contactHeading,
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
        navLinks:
          settings?.footer?.navLinks?.map((l: { label: string; href: string }) => ({
            label: l.label,
            href: l.href,
          })) ?? fallback.footer.navLinks,
        legalLinks:
          settings?.footer?.legalLinks?.map((l: { label: string; href: string }) => ({
            label: l.label,
            href: l.href,
          })) ?? fallback.footer.legalLinks,
        copyright: settings?.footer?.copyright ?? fallback.footer.copyright,
      },
      contact: {
        email: settings?.contactChannels?.email ?? fallback.contact.email,
        phone: settings?.contactChannels?.phone ?? fallback.contact.phone,
      },
      seo: {
        metaTitle: settings?.defaultSEO?.metaTitle ?? fallback.seo.metaTitle,
        metaDescription: settings?.defaultSEO?.metaDescription ?? fallback.seo.metaDescription,
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
