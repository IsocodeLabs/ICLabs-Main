import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Squircle } from '@/components/ui/Squircle'
import glass from '@/components/ui/Glass.module.css'

/** Dev-only design-system QA page — the Build 2 mono tokens + primitives. */
export default function DesignPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const swatches: Array<[string, string]> = [
    ['Ink', '#141210'],
    ['Paper', '#F5F1EA'],
    ['White', '#FFFFFF'],
    ['Grey', '#6B655E'],
    ['Hairline', '#D8D2C8'],
  ]

  const sizes = [12, 14, 16, 21, 28, 37, 50, 66, 88]

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', padding: '120px 48px 96px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 64 }}>
        <section>
          <Eyebrow>Colour — pure monochrome</Eyebrow>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {swatches.map(([name, hex]) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    background: hex,
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--hairline)',
                  }}
                />
                <span className="mono-label" style={{ fontSize: 10 }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <Eyebrow>Display — Anton</Eyebrow>
          {sizes.map((s) => (
            <p
              key={s}
              style={{
                fontFamily: s >= 28 ? 'var(--font-display)' : 'var(--font-sans)',
                fontSize: s,
                lineHeight: s >= 37 ? 0.98 : 1.5,
                letterSpacing: s >= 28 ? '0.005em' : 0,
                textTransform: s >= 28 ? 'uppercase' : 'none',
                margin: '10px 0',
              }}
            >
              {s} — Software, made properly.
            </p>
          ))}
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 18, marginTop: 20, maxWidth: 620 }}>
            Body copy is General Sans — clean, neutral, readable at length. It never borrows the
            display face. This paragraph is how running text feels on paper.
          </p>
          <p className="mono-label" style={{ marginTop: 16 }}>
            Space Mono label — from ISOCODELABS
          </p>
        </section>

        <section>
          <Eyebrow>Buttons</Eyebrow>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button>Primary — ink fill</Button>
            <Button variant="ghost">Secondary — outline</Button>
            <Button variant="quiet">Quiet</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large CTA</Button>
          </div>
        </section>

        <section>
          <Eyebrow>Cards + glass over paper</Eyebrow>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            <div
              style={{
                padding: 32,
                background: 'var(--white)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--e1)',
                minWidth: 220,
              }}
            >
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 34, textTransform: 'uppercase' }}>
                50 ms
              </p>
              <p style={{ color: 'var(--grey)', fontSize: 14, marginTop: 8 }}>
                white card · hairline · e1
              </p>
            </div>
            <div className={glass.glass} style={{ padding: 32, borderRadius: 'var(--r-lg)', minWidth: 220 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 34, textTransform: 'uppercase' }}>
                Glass
              </p>
              <p style={{ color: 'var(--grey)', fontSize: 14, marginTop: 8 }}>
                frosted paper · thin ink edge
              </p>
            </div>
          </div>
        </section>

        <section
          className="theme-ink"
          style={{ background: 'var(--ink)', padding: 48, borderRadius: 'var(--r-lg)' }}
        >
          <Eyebrow>Reverse register — ink</Eyebrow>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-display-md)',
              color: 'var(--paper)',
              marginTop: 16,
              textTransform: 'uppercase',
              lineHeight: 0.98,
            }}
          >
            Contrast comes from value, not colour.
          </h2>
          <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
            <div
              className={`${glass.glass} ${glass.dark}`}
              style={{ padding: 32, borderRadius: 'var(--r-lg)', color: 'var(--paper)', minWidth: 220 }}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 44, textTransform: 'uppercase' }}>
                88%
              </span>
              <p style={{ color: '#a49e95', fontSize: 14, marginTop: 8 }}>dark glass surface</p>
            </div>
            <div style={{ padding: 32, background: 'var(--paper)', borderRadius: 'var(--r-lg)', minWidth: 220 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 21, textTransform: 'uppercase' }}>
                Paper card on ink
              </p>
              <p style={{ color: 'var(--grey)', fontSize: 14, marginTop: 8 }}>reverse lift</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
