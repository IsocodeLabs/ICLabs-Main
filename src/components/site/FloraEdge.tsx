import type { CSSProperties } from 'react'
import styles from './FloraEdge.module.css'

type FloraEdgeProps = {
  /** which corners to frame — the asset carries flora at both bottom edges */
  side?: 'both' | 'left' | 'right'
  flip?: boolean
  /** relative scale + opacity, so each section's framing differs (code variety) */
  scale?: number
  opacity?: number
}

/**
 * Reuses the one flora-edges asset (transparent centre) to frame a section's
 * bottom corners, gently swaying. Sits behind content and outside the reading
 * column, so it frames — never competes with text (ui-trial §section treatment).
 * Per-section variety = flip / scale / opacity, all in code, one asset.
 */
export function FloraEdge({ side = 'both', flip = false, scale = 1, opacity = 0.9 }: FloraEdgeProps) {
  return (
    <div
      aria-hidden
      className={`${styles.frame} ${styles[side]}`}
      style={{ '--flora-scale': scale, '--flora-opacity': opacity, '--flora-flip': flip ? -1 : 1 } as CSSProperties}
    >
      <div className={styles.sway} />
    </div>
  )
}
