'use client'

import { useEffect, useState } from 'react'
import styles from './RoleDetail.module.css'

/**
 * Phones only (CSS hides it from 900px up): a sticky "Apply" button at the
 * bottom of a job page that jumps to the form, and gets out of the way once
 * the form (#apply) is on screen.
 */
export function StickyApply({ label }: { label: string }) {
  const [formVisible, setFormVisible] = useState(false)

  useEffect(() => {
    const target = document.getElementById('apply')
    if (!target) return
    // passive scroll listener (browsers fire scroll at most once per frame);
    // works with Lenis smooth scroll, which drives native scroll position
    const check = () => {
      const r = target.getBoundingClientRect()
      setFormVisible(r.top < window.innerHeight * 0.8 && r.bottom > 0)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return (
    <div className={`${styles.sticky} ${formVisible ? styles.stickyHidden : ''}`} aria-hidden={formVisible}>
      <a href="#apply" className={styles.stickyButton} tabIndex={formVisible ? -1 : 0}>
        {label}
      </a>
    </div>
  )
}
