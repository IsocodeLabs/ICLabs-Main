'use client'

import { useState } from 'react'
import { submitApplication } from '@/app/actions'
import type { ApplicationField, CareerRole, CareersContent } from '@/lib/content'
import { Eyebrow } from '@/components/ui/Eyebrow'
import glass from '@/components/ui/Glass.module.css'
import { useCareersRole } from './CareersRoleContext'
import styles from './CareersApply.module.css'

/**
 * The application form. Submits FormData (résumé rides along) to the
 * submitApplication server action; the DB refuses direct public writes.
 * Selected role comes from CareersRoleContext, shared with the (now
 * non-adjacent) Open Roles cards.
 */
export function CareersApplyForm({
  page,
  roles,
  form,
}: {
  page: CareersContent['page']
  roles: CareerRole[]
  form: CareersContent['form']
}) {
  const { role, setRole, applyRef } = useCareersRole()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    fd.set('role', role)
    fd.set('roleTitle', roles.find((r) => r.roleKey === role)?.title ?? '')
    try {
      const res = await submitApplication(fd)
      if (res.ok) setDone(true)
      else setError(res.error)
    } catch {
      // the network call itself failed (not a graceful {ok:false} — a hard
      // failure), so show something rather than leaving the button stuck
      setError('Couldn’t reach the server — check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="apply" className={styles.section} ref={applyRef}>
      <div className={styles.inner}>
        <div className={`${glass.glass} ${glass.dark} ${styles.formPanel}`}>
          {done ? (
            <div className={styles.done}>
              <h2 className={styles.doneHeading}>Application received.</h2>
              <p className={styles.doneNote}>
                A real person will read it. If there’s a fit, you’ll hear from us at the email you
                gave.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.blockHead}>
                <Eyebrow>{page.formEyebrow}</Eyebrow>
                <h2 className={styles.blockHeading}>{page.formHeading}</h2>
                <p className={styles.blockNote}>{page.formIntro}</p>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                {/* honeypot */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className={styles.honeypot}
                  aria-hidden
                />

                <div className={styles.field}>
                  <label htmlFor="app-name">Your name</label>
                  <input id="app-name" name="name" type="text" required placeholder="Full name" />
                </div>

                <div className={styles.field}>
                  <label htmlFor="app-email">Email</label>
                  <input
                    id="app-email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@email.com"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="app-role">Role</label>
                  <select
                    id="app-role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    {roles.map((r) => (
                      <option key={r.roleKey} value={r.roleKey}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                {form.fields.map((f) => (
                  <FormField key={f.key} field={f} />
                ))}

                <p className={styles.formPrivacy}>{form.intro}</p>

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.submit} disabled={submitting}>
                  {submitting ? 'Sending…' : 'Submit application'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function FormField({ field }: { field: ApplicationField }) {
  const id = `app-${field.key}`
  const common = { id, name: field.key, required: field.required }

  return (
    <div
      className={`${styles.field} ${
        field.type === 'textarea' || field.type === 'file' ? styles.fieldWide : ''
      }`}
    >
      <label htmlFor={id}>
        {field.label}
        {!field.required && <span className={styles.optional}> — optional</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea {...common} rows={4} placeholder={field.placeholder} />
      ) : field.type === 'select' ? (
        <select {...common} defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === 'file' ? (
        <input {...common} type="file" accept="application/pdf" className={styles.file} />
      ) : (
        <input
          {...common}
          type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
          placeholder={field.placeholder}
        />
      )}
    </div>
  )
}
