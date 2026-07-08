'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import styles from './FieldCapture.module.css'

export type CaptureField = {
  name: string
  label: string
  placeholder?: string
  type?: 'text' | 'email'
  optional?: boolean
}

type FieldCaptureProps = {
  fields: CaptureField[]
  submitLabel?: string
  doneHeading: string
  doneNote?: string
  onSubmit: (values: Record<string, string>) => Promise<{ ok: true } | { ok: false; error: string }>
}

/**
 * The one-field-at-a-time capture — the site's interaction signature.
 * Never show a wall of empty fields; hand over one considered thing at a time.
 */
export function FieldCapture({
  fields,
  submitLabel = 'Send',
  doneHeading,
  doneNote,
  onSubmit,
}: FieldCaptureProps) {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)

  const field = fields[step]
  const isLast = step === fields.length - 1

  // one input element serves every step — controlled, so the value always
  // belongs to the current field
  useEffect(() => {
    setDraft(values[fields[step].name] ?? '')
    inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const validate = (value: string): string => {
    if (!field.optional && !value.trim()) return 'This one we do need.'
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
      return 'That email doesn’t look complete — mind checking it?'
    }
    return ''
  }

  const advance = async (e?: FormEvent) => {
    e?.preventDefault()
    if (busy || done) return
    const problem = validate(draft)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    const next = { ...values, [field.name]: draft.trim() }
    setValues(next)

    if (!isLast) {
      setStep(step + 1)
      return
    }

    setBusy(true)
    const result = await onSubmit({ ...next, website: honeypotRef.current?.value ?? '' })
    setBusy(false)
    if (result.ok) setDone(true)
    else setError(result.error)
  }

  const goBack = () => {
    if (step === 0 || busy) return
    setError('')
    setStep(step - 1)
  }

  if (done) {
    return (
      <div className={styles.wrap} role="status">
        <p className={`${styles.done}`} style={{ fontFamily: 'var(--font-display)' }}>
          {doneHeading}
        </p>
        {doneNote && <p className={styles.doneNote}>{doneNote}</p>}
      </div>
    )
  }

  return (
    <form className={styles.wrap} onSubmit={advance} noValidate>
      <label className={styles.label} htmlFor={`capture-${field.name}`}>
        {field.label}
        {field.optional && <span className={styles.optional}>optional</span>}
      </label>
      <div className={styles.row}>
        <input
          ref={inputRef}
          id={`capture-${field.name}`}
          name={field.name}
          type={field.type ?? 'text'}
          placeholder={field.placeholder}
          className={styles.input}
          autoComplete={
            field.type === 'email' ? 'email' : field.name === 'name' ? 'name' : 'organization'
          }
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? 'Sending…' : isLast ? submitLabel : 'Next'}
        </Button>
      </div>
      {/* honeypot */}
      <input
        ref={honeypotRef}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
      />
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.meta}>
        <div className={styles.dots} aria-label={`Step ${step + 1} of ${fields.length}`}>
          {fields.map((f, i) => (
            <span key={f.name} className={`${styles.dot} ${i <= step ? styles.dotDone : ''}`} />
          ))}
        </div>
        {step > 0 && (
          <button type="button" className={styles.back} onClick={goBack}>
            ← back
          </button>
        )}
      </div>
    </form>
  )
}
