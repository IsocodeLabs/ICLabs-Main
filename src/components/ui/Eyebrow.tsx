import type { ReactNode } from 'react'

/** Mono micro-label — the software-brand craft detail. Use sparingly. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`mono-label ${className ?? ''}`}
      style={{ color: 'var(--copper)', display: 'inline-block' }}
    >
      {children}
    </span>
  )
}
