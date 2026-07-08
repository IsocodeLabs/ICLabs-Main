/**
 * Seeds the CMS with the canonical copy-deck content (idempotent-ish: skips
 * collections that already have documents; globals are always updated).
 *
 * Run:  npm run seed
 * Requires the dev DB running (npm run dev:db) and .env configured.
 */
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
} from '../src/lib/seed-data'

async function run() {
  const payload = await getPayload({ config })

  // ---- globals ----
  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      hero: {
        beliefLine: heroContent.beliefLine,
        subline: heroContent.subline,
        scrollBeats: heroContent.scrollBeats.map((text) => ({ text })),
      },
      problem: { narrative: problemContent.narrative.map((text) => ({ text })) },
      whatWeBuild: {
        heading: whatWeBuildContent.heading,
        body: whatWeBuildContent.body.map((text) => ({ text })),
      },
      labsIntro: {
        beliefBeat: labsContent.beliefBeat,
        heading: labsContent.heading,
        body: labsContent.body,
      },
      creatorMention: labsContent.creatorMention,
      cta: ctaContent,
      about: {
        heading: aboutContent.heading,
        body: aboutContent.body.map((text) => ({ text })),
        teamLine: aboutContent.teamLine,
        contactHeading: aboutContent.contactHeading,
      },
    },
  })
  console.log('✓ homepage global')

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      nav: [
        { label: 'What we build', href: '/#what-we-build' },
        { label: 'Labs', href: '/#labs' },
        { label: 'About', href: '/#about' },
      ],
      footer: {
        beliefLine: footerContent.beliefLine,
        navLinks: footerContent.navLinks,
        legalLinks: footerContent.legalLinks,
        copyright: footerContent.copyright,
      },
      defaultSEO: {
        metaTitle: siteSEO.metaTitle,
        metaDescription: siteSEO.metaDescription,
      },
      organizationJSONLD: {
        legalName: 'Isocode Labs',
        url: 'https://isocodelabs.com',
      },
      contactChannels,
    },
  })
  console.log('✓ site settings global')

  // ---- collections (skip if already populated) ----
  const seedCollection = async (
    slug: 'products' | 'stats' | 'values' | 'value-quotes',
    docs: Record<string, unknown>[],
  ) => {
    const existing = await payload.count({ collection: slug })
    if (existing.totalDocs > 0) {
      console.log(`- ${slug} already has ${existing.totalDocs} docs, skipping`)
      return
    }
    for (const doc of docs) {
      await payload.create({ collection: slug, data: doc as never })
    }
    console.log(`✓ ${slug} (${docs.length})`)
  }

  await seedCollection(
    'products',
    labsContent.products.map((p) => ({
      name: p.name,
      slug: p.slug,
      blurb: p.blurb,
      status: p.status,
      badge: p.badge,
      outboundURL: p.outboundURL,
      order: p.order,
      showOnSite: true,
    })),
  )
  await seedCollection('stats', statsContent.map((s, i) => ({ ...s, order: i + 1 })))
  await seedCollection('values', valuesContent)
  await seedCollection(
    'value-quotes',
    valueQuotes.map((quote, i) => ({ quote, order: i + 1, active: true })),
  )

  // ---- short quiz ----
  const quizzes = await payload.count({ collection: 'quizzes' })
  if (quizzes.totalDocs === 0) {
    const quiz = await payload.create({
      collection: 'quizzes',
      data: {
        name: shortQuiz.name,
        type: shortQuiz.type,
        entryHeading: shortQuiz.entryHeading,
        entryCopy: shortQuiz.entryCopy,
        closeHeading: shortQuiz.closeHeading,
        closeCopy: shortQuiz.closeCopy,
        active: true,
      },
    })
    for (const q of shortQuiz.questions) {
      await payload.create({
        collection: 'quiz-questions',
        data: {
          quiz: quiz.id,
          order: q.order,
          type: q.type,
          prompt: q.prompt,
          helperText: q.helperText,
          signalKey: q.signalKey as never,
          options: q.options.map((o) => ({ label: o.label, value: o.value })),
        },
      })
    }
    console.log(`✓ short quiz (${shortQuiz.questions.length} questions)`)
  } else {
    console.log('- quizzes already present, skipping')
  }

  console.log('\nSeed complete.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
