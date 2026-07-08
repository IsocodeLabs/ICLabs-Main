import { getSiteContent } from '@/lib/content'
import { BackgroundConductor } from '@/components/motion/BackgroundConductor'
import { TrailSpine } from '@/components/motion/TrailSpine'
import { Hero } from '@/components/hero/Hero'
import { Problem } from '@/components/sections/Problem'
import { WhatWeBuild } from '@/components/sections/WhatWeBuild'
import { Labs } from '@/components/sections/Labs'
import { CtaQuiz } from '@/components/sections/CtaQuiz'
import { About } from '@/components/sections/About'
import { Footer } from '@/components/site/Footer'

export const revalidate = 300 // ISR — CMS edits appear within 5 minutes

export default async function HomePage() {
  const content = await getSiteContent()

  return (
    <>
      <BackgroundConductor />
      <div style={{ position: 'relative' }}>
        <TrailSpine />
        <main>
          {/* the hero paints itself; data-bg hands Paper to the conductor
              so the blend into Midnight starts as Problem approaches */}
          <div data-bg="#F4EFE6" data-glow="0" data-trail="center" style={{ '--self-bg': '#F4EFE6' } as React.CSSProperties}>
            <Hero
              beliefLine={content.hero.beliefLine}
              subline={content.hero.subline}
              scrollBeats={content.hero.scrollBeats}
            />
          </div>
          <Problem narrative={content.problem.narrative} stats={content.stats} />
          <WhatWeBuild heading={content.whatWeBuild.heading} body={content.whatWeBuild.body} />
          <Labs
            beliefBeat={content.labs.beliefBeat}
            heading={content.labs.heading}
            body={content.labs.body}
            products={content.labs.products}
            creatorMention={content.labs.creatorMention}
          />
          <CtaQuiz
            heading={content.cta.heading}
            body={content.cta.body}
            quizLabel={content.cta.quizLabel}
            hatchLabel={content.cta.hatchLabel}
            contactEmail={content.contact.email}
            quotes={content.quotes}
          />
          <About
            heading={content.about.heading}
            body={content.about.body}
            teamLine={content.about.teamLine}
            contactHeading={content.about.contactHeading}
            values={content.values}
          />
        </main>
        <Footer
          beliefLine={content.footer.beliefLine}
          navLinks={content.footer.navLinks}
          legalLinks={content.footer.legalLinks}
          copyright={content.footer.copyright}
        />
      </div>
    </>
  )
}
