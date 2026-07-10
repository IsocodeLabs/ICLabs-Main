import { getPayload } from 'payload'
import config from '@payload-config'
import {
  aboutContent,
  aboutPageContent,
  applicationForm,
  careersContent,
  contactChannels,
  ctaContent,
  footerContent,
  foundersContent,
  heroContent,
  jobOpenings,
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
      founders:
        founders.docs.length > 0
          ? founders.docs.map((f, i) => ({
              name: f.name,
              title: f.title ?? 'Co-founder',
              photo: mediaURL(f.photo, fallback.founders[i % fallback.founders.length]?.photo ?? ''),
              eduLine: f.eduLine ?? '',
              socials: (f.socials ?? [])
                .filter((s: { url?: string }) => Boolean(s.url))
                .map((s: { platform: string; url: string }) => ({
                  platform: s.platform,
                  url: s.url,
                })),
            }))
          : fallback.founders,
      contact: {
        email: settings?.contactChannels?.email ?? fallback.contact.email,
        phone: settings?.contactChannels?.phone ?? fallback.contact.phone,
      },
    }
  } catch {
    return fallback
  }
}

export type CareerRole = {
  title: string
  roleKey: string
  type: string
  dept: string
  location: string
  stipend: string
  blurb: string
  openApplication: boolean
}

export type ApplicationField = {
  key: string
  label: string
  type: 'text' | 'email' | 'url' | 'textarea' | 'select' | 'file'
  placeholder?: string
  required: boolean
  options?: { label: string; value: string }[]
}

export type CareersContent = {
  page: typeof careersContent
  roles: CareerRole[]
  form: { intro: string; fields: ApplicationField[] }
}

/**
 * The Careers page. Reads active job openings + the application-form config from
 * the CMS, falling back field-by-field to seed so nothing renders blank. Roles
 * are sorted by `order`; the open application is just another opening flagged
 * `openApplication`.
 */
export async function getCareersContent(): Promise<CareersContent> {
  const toRole = (r: (typeof jobOpenings)[number]): CareerRole => ({
    title: r.title,
    roleKey: r.roleKey,
    type: r.type,
    dept: r.dept,
    location: r.location,
    stipend: r.stipend,
    blurb: r.blurb,
    openApplication: r.openApplication,
  })

  const fallback: CareersContent = {
    page: careersContent,
    roles: jobOpenings.filter((r) => r.active).map(toRole),
    form: { intro: applicationForm.intro, fields: applicationForm.fields },
  }

  try {
    const payload = await getPayload({ config })
    const [openings, form] = await Promise.all([
      payload.find({
        collection: 'job-openings',
        where: { active: { equals: true } },
        sort: 'order',
        limit: 50,
      }),
      payload.findGlobal({ slug: 'application-form' }),
    ])

    return {
      page: careersContent,
      roles:
        openings.docs.length > 0
          ? openings.docs.map((o) => ({
              title: o.title,
              roleKey: o.roleKey,
              type: o.type ?? 'fullTime',
              dept: o.dept ?? '',
              location: o.location ?? 'Remote',
              stipend: o.stipend ?? '',
              blurb: o.blurb ?? '',
              openApplication: Boolean(o.openApplication),
            }))
          : fallback.roles,
      form: {
        intro: form?.intro ?? fallback.form.intro,
        fields:
          form?.fields && form.fields.length > 0
            ? form.fields.map((f) => ({
                key: f.key,
                label: f.label,
                type: (f.type ?? 'text') as ApplicationField['type'],
                placeholder: f.placeholder ?? undefined,
                required: Boolean(f.required),
                options: (f.options ?? [])
                  .filter((o): o is { label: string; value: string } =>
                    Boolean(o.label && o.value),
                  )
                  .map((o) => ({ label: o.label, value: o.value })),
              }))
            : fallback.form.fields,
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
