import type { CareerRole } from '@/lib/careers/content'
import styles from './RoleDetail.module.css'

/**
 * Hiring process — an ordered list (so screen readers announce "step 1 of 4"),
 * laid out as a horizontal stepper on desktop and a vertical one on mobile.
 */
export function HiringStepper({ steps }: { steps: CareerRole['hiringProcess'] }) {
  return (
    <ol className={styles.stepper} style={{ ['--steps' as string]: steps.length }}>
      {steps.map((s, i) => (
        <li key={`${i}-${s.title}`} className={styles.step}>
          <span className={styles.stepNum} aria-hidden>
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className={styles.stepTitle}>{s.title}</span>
          {s.description && <span className={styles.stepBody}>{s.description}</span>}
        </li>
      ))}
    </ol>
  )
}
