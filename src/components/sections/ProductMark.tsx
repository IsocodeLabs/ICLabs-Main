/**
 * Product marks — one illustrated family, drawn in the language of the IL
 * monogram: heavy flat bars, no outlines or gradients, the whole drawing
 * sheared at one angle. Each mark *depicts* what the product is (a CV page, a
 * quote bubble, a tree of nodes, a clinic cross) in ink plus a single accent
 * tone, so the four sit together as one set without being identical.
 *
 * Shapes are authored on a 100-unit-tall grid, orthogonal, then sheared as a
 * group. Add a product by adding an entry to MARKS.
 */

type Tone = 'ink' | 'accent'
type Shape =
  | { r: [x: number, y: number, w: number, h: number]; t?: Tone }
  | { p: string; t?: Tone }

type Mark = { w: number; accent: string; shapes: Shape[] }

const SHEAR = 24 // degrees — a softer cousin of the IL monogram's slant
const TAN = Math.tan((SHEAR * Math.PI) / 180)

const MARKS: Record<string, Mark> = {
  /* a CV page: folded corner, ruled lines, one accent heading bar */
  cvbuddy: {
    w: 78,
    accent: '#2f5d8c',
    shapes: [
      { r: [0, 0, 14, 100] },
      { r: [0, 0, 50, 14] },
      { r: [0, 86, 78, 14] },
      { r: [64, 30, 14, 70] },
      { p: '50,0 78,30 50,30', t: 'accent' },
      { r: [28, 40, 34, 10], t: 'accent' },
      { r: [28, 58, 22, 8] },
      { r: [28, 72, 34, 8] },
    ],
  },
  /* a quote bubble: line items and one accent total */
  clearquote: {
    w: 100,
    accent: '#b4683a',
    shapes: [
      { r: [0, 0, 100, 14] },
      { r: [0, 0, 14, 70] },
      { r: [86, 0, 14, 70] },
      { r: [0, 56, 100, 14] },
      { p: '14,70 38,70 14,96' },
      { r: [28, 24, 44, 8] },
      { r: [28, 40, 28, 8] },
      { r: [60, 38, 26, 12], t: 'accent' },
    ],
  },
  /* a tree of nodes: trunk, two branches, three accent leaves */
  lifetreeos: {
    w: 100,
    accent: '#58743f',
    shapes: [
      { r: [43, 14, 14, 86] },
      { r: [24, 90, 52, 10] },
      { p: '43,62 43,76 17,50 17,36' },
      { p: '57,62 57,76 83,50 83,36' },
      { r: [4, 8, 26, 26], t: 'accent' },
      { r: [70, 8, 26, 26], t: 'accent' },
      { r: [37, 0, 26, 26], t: 'accent' },
    ],
  },
  /* a clinic window: frame, desk slab, accent cross */
  meddesk: {
    w: 100,
    accent: '#2f8079',
    shapes: [
      { r: [0, 0, 14, 100] },
      { r: [86, 0, 14, 100] },
      { r: [0, 86, 100, 14] },
      { r: [36, 14, 28, 62], t: 'accent' },
      { r: [22, 28, 56, 28], t: 'accent' },
    ],
  },
}

export function ProductMark({
  slug,
  name,
  className,
}: {
  slug: string
  name: string
  className?: string
}) {
  const mark = MARKS[slug]
  if (!mark) return null

  const rise = mark.w * TAN
  const fill = (t?: Tone) => (t === 'accent' ? mark.accent : 'currentColor')

  return (
    <svg
      viewBox={`0 ${-rise} ${mark.w} ${100 + rise}`}
      className={className}
      role="img"
      aria-label={`${name} mark`}
      shapeRendering="geometricPrecision"
    >
      <g transform={`skewY(-${SHEAR})`}>
        {mark.shapes.map((s, i) =>
          'r' in s ? (
            <rect key={i} x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} fill={fill(s.t)} />
          ) : (
            <polygon key={i} points={s.p} fill={fill(s.t)} />
          ),
        )}
      </g>
    </svg>
  )
}
