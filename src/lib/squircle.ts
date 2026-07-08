/**
 * Continuous (G2) corner curvature — ui.md's felt-not-seen craft detail.
 * Superellipse-blended corners sampled into an SVG path for clip-path.
 * Plain border-radius arcs are the thing we deliberately avoid.
 */

/** Superellipse quadrant point (exponent n≈4 reads as iOS-continuous). */
function cornerPoints(r: number, n = 4, samples = 14): Array<[number, number]> {
  const pts: Array<[number, number]> = []
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * (Math.PI / 2)
    const x = Math.pow(Math.cos(t), 2 / n) * r
    const y = Math.pow(Math.sin(t), 2 / n) * r
    pts.push([x, y])
  }
  return pts
}

export function squirclePath(w: number, h: number, radius: number): string {
  const r = Math.min(radius, w / 2, h / 2)
  if (r <= 0 || w <= 0 || h <= 0) return ''
  const c = cornerPoints(r)
  const f = (v: number) => Math.round(v * 100) / 100

  let d = `M ${f(r)} 0 L ${f(w - r)} 0 `
  // top-right: from (w-r,0) to (w,r)
  for (const [x, y] of c) d += `L ${f(w - r + y)} ${f(r - x)} `
  d += `L ${f(w)} ${f(h - r)} `
  // bottom-right
  for (const [x, y] of c) d += `L ${f(w - r + x)} ${f(h - r + y)} `
  d += `L ${f(r)} ${f(h)} `
  // bottom-left
  for (const [x, y] of c) d += `L ${f(r - y)} ${f(h - r + x)} `
  d += `L 0 ${f(r)} `
  // top-left
  for (const [x, y] of c) d += `L ${f(r - x)} ${f(r - y)} `
  return d + 'Z'
}
