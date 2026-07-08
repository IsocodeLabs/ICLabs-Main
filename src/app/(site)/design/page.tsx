import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Squircle } from '@/components/ui/Squircle'
import glass from '@/components/ui/Glass.module.css'

/** Dev-only design-system QA page — every token + primitive, both registers. */
export default function DesignPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const swatches = [
    ['Paper', '#F4EFE6'],
    ['Ink', '#1A1714'],
    ['Midnight', '#12161C'],
    ['Copper', '#B06A3B'],
    ['Copper-lit', '#CE9463'],
    ['Copper-deep', '#7E4A28'],
    ['Taupe', '#8A7F70'],
  ]

  const sizes = [12, 14, 16, 21, 28, 37, 50, 66, 88]

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', padding: '120px 48px 96px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 64 }}>
        <section>
          <Eyebrow>Colour</Eyebrow>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {swatches.map(([name, hex]) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <Squircle radius={16} style={{ width: 96, height: 96, background: hex }} />
                <span className="mono-label" style={{ fontSize: 10 }}>
                  {name}
                </span>
              </div>
            ))}
            <div style={{ textAlign: 'center' }}>
              <Squircle radius={16} style={{ width: 96, height: 96, background: 'var(--copper-metal)' }} />
              <span className="mono-label" style={{ fontSize: 10 }}>
                forged
              </span>
            </div>
          </div>
        </section>

        <section>
          <Eyebrow>Type — perfect fourth</Eyebrow>
          {sizes.map((s) => (
            <p
              key={s}
              style={{
                fontFamily: s >= 28 ? 'var(--font-display)' : 'var(--font-sans)',
                fontSize: s,
                lineHeight: s >= 37 ? 1.06 : 1.5,
                margin: '8px 0',
              }}
            >
              {s} — Software, made properly.
            </p>
          ))}
          <p className="mono-label" style={{ marginTop: 16 }}>
            mono label — v3.0.0
          </p>
        </section>

        <section>
          <Eyebrow>Buttons</Eyebrow>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button>Primary — forged copper</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="quiet">Quiet</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large CTA</Button>
          </div>
        </section>

        <section className="theme-midnight" style={{ background: 'var(--midnight)', padding: 48, borderRadius: 24 }}>
          <Eyebrow>Midnight register — copper as light</Eyebrow>
          <h2 style={{ fontSize: 'var(--text-display-md)', color: 'var(--paper)', marginTop: 16 }}>
            Warm copper only glows because Midnight is cool.
          </h2>
          <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
            <Squircle radius={16} className={`${glass.glass} ${glass.dark}`} style={{ padding: 32, color: 'var(--paper)' }}>
              <span className="copper-text" style={{ fontFamily: 'var(--font-display)', fontSize: 50 }}>
                50 ms
              </span>
              <p style={{ color: '#9aa1ab', fontSize: 14, marginTop: 8 }}>dark glass surface, e1</p>
            </Squircle>
            <Squircle radius={16} style={{ padding: 32, background: '#fffdf9' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 21 }}>Paper card on Midnight</p>
              <p style={{ color: 'var(--taupe)', fontSize: 14, marginTop: 8 }}>G2 squircle corners</p>
            </Squircle>
          </div>
        </section>
      </div>
    </div>
  )
}
