'use client'

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import glass from '@/components/ui/Glass.module.css'
import type { CareerRole, CareersContent } from '@/lib/careers/content'
import { careersHref } from '@/lib/careers/urls'
import { contactChannels } from '@/lib/seed-data'
import {
  fieldsFor,
  INTEREST_AREAS,
  LIMITS,
  maxGradYear,
  minStartDate,
  validateApplication,
  validateResumeFile,
  type ApplicationInput,
  type FieldErrors,
} from '@/lib/careers/validation'
import { useOptionalCareersRole } from './CareersRoleContext'
import { useTurnstile, type TurnstileStatus } from './useTurnstile'
import styles from './CareersApply.module.css'

/**
 * Round 1 application form (FR4–FR7).
 *
 * The CV uploads the moment it's picked — straight to the private bucket via a
 * signed POST from /api/careers/upload-url — so by the time the rest of the form
 * is filled, the slow part is done. Submit then sends only form data + the
 * object key to /api/careers/apply with a client-generated submissionId, which
 * makes retries and double clicks safe (the server returns the original
 * success). Answers persist in localStorage so a failure never wipes them.
 *
 * On the main page the role comes from CareersRoleContext (shared with the
 * Open Application CTA); on a role page it's locked to that role.
 */
const STORAGE_KEY = 'isocode-careers-apply-v2'

const HUMAN_CHECK_FAILED =
  'The “Verify you are human” check didn’t finish, so your CV wasn’t uploaded. Tick the box below the CV field (or reload the page), then pick your file again.'

type UploadState =
  | { status: 'idle' }
  | { status: 'verifying'; fileName: string }
  | { status: 'uploading'; progress: number; fileName: string }
  | { status: 'done'; fileName: string; objectKey: string; ticket: string }
  | { status: 'error'; fileName: string; message: string }

type Saved = { fields: ApplicationInput; submissionId?: string; role?: string }

function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

function save(s: Saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // private mode / storage blocked — the form still works, it just won't remember
  }
}

function clearSaved() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function uuid(): string {
  const c = globalThis.crypto
  if (typeof c.randomUUID === 'function') return c.randomUUID()
  // RFC4122 v4 fallback for older browsers / non-secure contexts
  const b = c.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** multipart POST straight to the bucket, with progress */
function postToBucket(
  url: string,
  fields: Record<string, string>,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) fd.append(k, v)
    fd.append('file', file) // must be last for GCS
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload ${xhr.status}`)))
    xhr.onerror = () => reject(new Error('network'))
    xhr.ontimeout = () => reject(new Error('timeout'))
    xhr.timeout = 120_000
    xhr.send(fd)
  })
}

export function ApplyForm({
  page,
  roles,
  intro,
  lockedRole,
  humanCheck = false,
}: {
  page: CareersContent['page']
  roles: CareerRole[]
  intro: string
  /** role page: the form is fixed to this role */
  lockedRole?: CareerRole
  /** Cloudflare Turnstile before uploads (CAREERS_HUMAN_CHECK) */
  humanCheck?: boolean
}) {
  const ctx = useOptionalCareersRole()
  const roleKey = lockedRole?.roleKey ?? ctx?.role ?? roles[0]?.roleKey ?? ''
  const role = lockedRole ?? roles.find((r) => r.roleKey === roleKey) ?? roles[0]
  const kind = role?.roleKind ?? 'sde'
  const f = fieldsFor(kind)

  const [fields, setFields] = useState<ApplicationInput>({})
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  // set when the failure is ours (server/network), not something the applicant
  // can fix in the form: we then offer email as a way through
  const [offerEmail, setOfferEmail] = useState(false)
  const [upload, setUpload] = useState<UploadState>({ status: 'idle' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [announce, setAnnounce] = useState('')

  // a submission id is only ever reused for the role it was created for
  const submissionIdRef = useRef<{ id: string; role: string } | undefined>(undefined)
  const submittingRef = useRef(false) // state lags a fast double click; the ref doesn't
  const uploadPromiseRef = useRef<Promise<UploadState> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const restoredRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const turnstile = useTurnstile(humanCheck)
  const { getToken, prepare: prepareHumanCheck } = turnstile

  // a CV is waiting on a "Verify you are human" tick: bring the box into view
  const waitingOnTick = upload.status === 'verifying' && turnstile.status === 'interactive'
  useEffect(() => {
    if (waitingOnTick) turnstile.containerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [waitingOnTick, turnstile.containerRef])

  // restore saved answers once
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    const saved = loadSaved()
    if (saved) {
      setFields(saved.fields ?? {})
      if (saved.submissionId && saved.role) {
        submissionIdRef.current = { id: saved.submissionId, role: saved.role }
      }
    }
  }, [])

  // persist answers (never the file)
  useEffect(() => {
    if (!restoredRef.current || done) return
    save({ fields, submissionId: submissionIdRef.current?.id, role: submissionIdRef.current?.role })
  }, [fields, done])

  const set = (key: keyof ApplicationInput, value: string | boolean) => {
    setFields((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const startUpload = useCallback(
    (file: File) => {
      const run = async (): Promise<UploadState> => {
        let lastError = 'Upload failed. Check your connection and pick the file again.'
        for (let attempt = 0; attempt < 2; attempt++) {
          // 1) the human check — usually already done (started on first touch of
          //    the form); otherwise it may need a tick, which the status asks for
          setUpload({ status: 'verifying', fileName: file.name })
          let token: string
          try {
            token = await getToken()
          } catch {
            const final: UploadState = { status: 'error', fileName: file.name, message: HUMAN_CHECK_FAILED }
            setUpload(final)
            setAnnounce(final.message)
            return final
          }
          // 2) the upload slot, then the file straight to the bucket
          setUpload({ status: 'uploading', progress: 0, fileName: file.name })
          setAnnounce('Uploading your CV…')
          try {
            const res = await fetch('/api/careers/upload-url', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                role: roleKey,
                fileSize: file.size,
                contentType: 'application/pdf',
                turnstileToken: token,
              }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok || !data.ok) {
              // a definite "no" (bad file, role closed, rate limit) — don't retry
              const final: UploadState = {
                status: 'error',
                fileName: file.name,
                message: data.error || lastError,
              }
              setUpload(final)
              setAnnounce(final.message)
              return final
            }
            await postToBucket(data.upload.url, data.upload.fields, file, (progress) =>
              setUpload({ status: 'uploading', progress, fileName: file.name }),
            )
            const ok: UploadState = {
              status: 'done',
              fileName: file.name,
              objectKey: data.objectKey,
              ticket: data.ticket,
            }
            setUpload(ok)
            setAnnounce('CV uploaded.')
            return ok
          } catch {
            lastError = 'Upload failed. Check your connection and pick the file again.'
            // one automatic retry
          }
        }
        const failed: UploadState = { status: 'error', fileName: file.name, message: lastError }
        setUpload(failed)
        setAnnounce(failed.message)
        return failed
      }
      const p = run()
      uploadPromiseRef.current = p
      return p
    },
    [roleKey, getToken],
  )

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setErrors((prev) => ({ ...prev, resume: undefined }))
    if (!file) return
    const problem = validateResumeFile(file)
    if (problem) {
      setUpload({ status: 'error', fileName: file.name, message: problem })
      setAnnounce(problem)
      e.target.value = ''
      return
    }
    void startUpload(file)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submittingRef.current) return
    setFormError(null)
    setOfferEmail(false)

    const checked = validateApplication(fields, kind)
    const nextErrors: FieldErrors = checked.ok ? {} : { ...checked.errors }
    if (upload.status === 'idle') nextErrors.resume = 'Please attach your CV as a PDF.'
    if (upload.status === 'error') nextErrors.resume = upload.message
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setFormError('Please check the highlighted fields.')
      focusFirstError(nextErrors)
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    try {
      // the upload may still be running — wait for it
      let up = upload
      if ((up.status === 'uploading' || up.status === 'verifying') && uploadPromiseRef.current) {
        up = await uploadPromiseRef.current
      }
      if (up.status !== 'done') {
        setErrors({ resume: up.status === 'error' ? up.message : 'Please attach your CV as a PDF.' })
        setFormError('Your CV didn’t upload — please attach it again.')
        return
      }

      // a draft made for another role (the role was switched, or an earlier attempt
      // went to a different role) gets a fresh id, so it can't collide with that one
      let current = submissionIdRef.current
      if (current?.role !== roleKey) {
        current = { id: uuid(), role: roleKey }
        submissionIdRef.current = current
        save({ fields, submissionId: current.id, role: roleKey })
      }
      const honeypot = (formRef.current?.elements.namedItem('website') as HTMLInputElement | null)?.value ?? ''

      const res = await fetch('/api/careers/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submissionId: current.id,
          role: roleKey,
          objectKey: up.objectKey,
          ticket: up.ticket,
          website: honeypot,
          fields,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        clearSaved()
        submissionIdRef.current = undefined
        setDone(true)
        setAnnounce(page.successMessage)
        return
      }
      if (data.fieldErrors) {
        setErrors(data.fieldErrors)
        focusFirstError(data.fieldErrors)
      }
      if (data.code === 'upload_expired' || data.code === 'upload_missing' || data.code === 'not_pdf') {
        setUpload({ status: 'idle' })
        if (fileInputRef.current) fileInputRef.current.value = ''
        setErrors((prev) => ({ ...prev, resume: data.error }))
      }
      if (data.code === 'duplicate') {
        clearSaved()
        submissionIdRef.current = undefined
      }
      if (data.code === 'submission_conflict') {
        // our saved id is from another role: start over with a new one next time
        submissionIdRef.current = undefined
      }
      setFormError(data.error || 'Something went wrong on our side — your answers are saved. Please try again.')
      if (!data.fieldErrors && data.code !== 'duplicate') setOfferEmail(true)
    } catch {
      setFormError('Couldn’t reach the server — check your connection and try again. Your answers are saved.')
      setOfferEmail(true)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  function focusFirstError(errs: FieldErrors) {
    const first = Object.keys(errs).find((k) => errs[k as keyof FieldErrors])
    if (!first) return
    const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)
    el?.focus()
  }

  if (!role) return null

  return (
    <section id="apply" className={styles.section} ref={lockedRole ? undefined : ctx?.applyRef}>
      <div className={styles.inner}>
        <div className={`${glass.glass} ${glass.dark} ${styles.formPanel}`}>
          {done ? (
            <div className={styles.done} role="status">
              <h2 className={styles.doneHeading}>Application received.</h2>
              <p className={styles.doneNote}>{page.successMessage}</p>
            </div>
          ) : (
            <>
              <div className={styles.blockHead}>
                <Eyebrow>{page.formEyebrow}</Eyebrow>
                <h2 className={styles.blockHeading}>
                  {lockedRole ? `Apply: ${lockedRole.title}` : page.formHeading}
                </h2>
                <p className={styles.blockNote}>{page.formIntro}</p>
              </div>

              <form
                ref={formRef}
                className={styles.form}
                onSubmit={handleSubmit}
                onFocusCapture={() => void prepareHumanCheck()}
                noValidate
              >
                {/* honeypot */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className={styles.honeypot}
                  aria-hidden
                />

                {!lockedRole && (
                  <Field label="Role" id="app-role" wide>
                    <select
                      id="app-role"
                      value={roleKey}
                      onChange={(e) => ctx?.setRole(e.target.value)}
                    >
                      {roles.map((r) => (
                        <option key={r.roleKey} value={r.roleKey}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                <TextField k="name" label="Full name" autoComplete="name" fields={fields} errors={errors} set={set} max={LIMITS.name} />
                <TextField k="email" label="Email" type="email" autoComplete="email" fields={fields} errors={errors} set={set} max={LIMITS.email} />
                <TextField
                  k="phone"
                  label="Phone (WhatsApp)"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  fields={fields}
                  errors={errors}
                  set={set}
                  max={LIMITS.phone}
                />
                <TextField k="college" label="College / University" autoComplete="organization" fields={fields} errors={errors} set={set} max={LIMITS.college} />
                <TextField
                  k="gradYear"
                  label="Graduation year"
                  type="number"
                  inputMode="numeric"
                  placeholder="2027"
                  min={2000}
                  maxNum={maxGradYear()}
                  fields={fields}
                  errors={errors}
                  set={set}
                />
                <TextField
                  k="startDate"
                  label="Earliest start date"
                  type="date"
                  min={minStartDate()}
                  fields={fields}
                  errors={errors}
                  set={set}
                />

                {f.linkedin && (
                  <TextField
                    k="linkedinUrl"
                    wide
                    label="LinkedIn URL"
                    type="url"
                    placeholder="https://linkedin.com/in/…"
                    optional={f.linkedin === 'oneOf'}
                    fields={fields}
                    errors={errors}
                    set={set}
                    max={LIMITS.url}
                  />
                )}
                {f.github && (
                  <TextField
                    k="githubUrl"
                    wide
                    label="GitHub URL"
                    type="url"
                    placeholder="https://github.com/…"
                    optional={f.github === 'oneOf'}
                    fields={fields}
                    errors={errors}
                    set={set}
                    max={LIMITS.url}
                  />
                )}
                {f.portfolio && (
                  <TextField
                    k="portfolioUrl"
                    wide
                    label={kind === 'pm' ? 'Portfolio, or a sample PRD / mockup link' : 'Portfolio URL'}
                    type="url"
                    placeholder="https://"
                    optional
                    fields={fields}
                    errors={errors}
                    set={set}
                    max={LIMITS.url}
                  />
                )}
                {f.project && (
                  <TextField
                    k="projectUrl"
                    wide
                    label="Best shipped project"
                    type="url"
                    placeholder="https://"
                    optional
                    fields={fields}
                    errors={errors}
                    set={set}
                    max={LIMITS.url}
                  />
                )}
                {f.interestArea && (
                  <Field label="Area of interest" id="app-interestArea" wide error={errors.interestArea}>
                    <select
                      id="app-interestArea"
                      data-field="interestArea"
                      value={fields.interestArea ?? ''}
                      onChange={(e) => set('interestArea', e.target.value)}
                      aria-invalid={Boolean(errors.interestArea)}
                      aria-describedby={errors.interestArea ? 'app-interestArea-error' : undefined}
                    >
                      <option value="" disabled>
                        Choose…
                      </option>
                      {INTEREST_AREAS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {f.why && (
                  <AreaField
                    k="why"
                    label="What would you do at Isocode?"
                    max={LIMITS.why}
                    fields={fields}
                    errors={errors}
                    set={set}
                  />
                )}
                {f.pitchNote && (
                  <AreaField
                    k="pitchNote"
                    label="Something you’ve sold, pitched or launched"
                    max={LIMITS.pitchNote}
                    optional
                    fields={fields}
                    errors={errors}
                    set={set}
                  />
                )}

                {/* CV upload */}
                <Field label="CV (PDF, up to 5 MB)" id="app-resume" wide error={errors.resume}>
                  <input
                    ref={fileInputRef}
                    id="app-resume"
                    data-field="resume"
                    type="file"
                    accept="application/pdf,.pdf"
                    className={styles.file}
                    onChange={onFile}
                    aria-invalid={Boolean(errors.resume)}
                    aria-describedby={`app-resume-status${errors.resume ? ' app-resume-error' : ''}`}
                  />
                  <UploadStatus upload={upload} humanCheck={turnstile.status} />
                  {/* the human check sits right under the CV field: when Cloudflare
                      wants a tick, it shows up where the applicant is looking */}
                  {turnstile.enabled && (
                    <>
                      {turnstile.status === 'interactive' && upload.status !== 'verifying' && (
                        <span className={styles.uploadHint}>
                          Quick check before your CV can upload: tick “Verify you are human”.
                        </span>
                      )}
                      <div ref={turnstile.containerRef} className={styles.turnstile} />
                    </>
                  )}
                </Field>

                {f.commit && (
                  <CheckField
                    k="commitSixMonths"
                    fields={fields}
                    errors={errors}
                    set={set}
                    label="I can commit to 6 months, remote."
                  />
                )}
                <CheckField
                  k="consent"
                  fields={fields}
                  errors={errors}
                  set={set}
                  label={
                    <>
                      I agree to Isocode using these details to assess my application, as described in the{' '}
                      <a href={careersHref('/applicant-privacy')} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                        applicant privacy notice
                      </a>
                      .
                    </>
                  }
                />

                <p className={styles.formPrivacy}>{intro}</p>


                {formError && (
                  <p className={styles.error} role="alert">
                    {formError}
                    {offerEmail && (
                      <>
                        {' '}
                        Still stuck? Email your CV and details to{' '}
                        <a href={`mailto:${contactChannels.email}`} className={styles.inlineLink}>
                          {contactChannels.email}
                        </a>
                        .
                      </>
                    )}
                  </p>
                )}

                <button type="submit" className={styles.submit} disabled={submitting} aria-busy={submitting}>
                  {submitting
                    ? upload.status === 'uploading' || upload.status === 'verifying'
                      ? 'Finishing upload…'
                      : 'Sending…'
                    : 'Submit application'}
                </button>
              </form>
            </>
          )}
          <p className="visually-hidden" aria-live="polite">
            {announce}
          </p>
        </div>
      </div>
    </section>
  )
}

/* ── field pieces ─────────────────────────────────────────────────────────── */

type SetFn = (key: keyof ApplicationInput, value: string | boolean) => void

function Field({
  label,
  id,
  children,
  wide,
  error,
  optional,
}: {
  label: ReactNode
  id: string
  children: ReactNode
  wide?: boolean
  error?: string
  optional?: boolean
}) {
  return (
    <div className={`${styles.field} ${wide ? styles.fieldWide : ''}`}>
      <label htmlFor={id}>
        {label}
        {optional && <span className={styles.optional}> — optional</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  )
}

function TextField({
  k,
  label,
  type = 'text',
  fields,
  errors,
  set,
  optional,
  wide,
  placeholder,
  autoComplete,
  inputMode,
  min,
  maxNum,
  max,
}: {
  k: keyof ApplicationInput
  label: string
  type?: string
  fields: ApplicationInput
  errors: FieldErrors
  set: SetFn
  optional?: boolean
  wide?: boolean
  placeholder?: string
  autoComplete?: string
  inputMode?: 'numeric'
  min?: number | string
  maxNum?: number
  max?: number
}) {
  const id = `app-${k}`
  const error = errors[k]
  return (
    <Field label={label} id={id} error={error} optional={optional} wide={wide}>
      <input
        id={id}
        data-field={k}
        type={type}
        value={String(fields[k] ?? '')}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        max={maxNum}
        maxLength={max}
        required={!optional}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </Field>
  )
}

function AreaField({
  k,
  label,
  max,
  fields,
  errors,
  set,
  optional,
}: {
  k: 'why' | 'pitchNote'
  label: string
  max: number
  fields: ApplicationInput
  errors: FieldErrors
  set: SetFn
  optional?: boolean
}) {
  const id = `app-${k}`
  const value = String(fields[k] ?? '')
  const error = errors[k]
  const counterId = useId()
  return (
    <Field label={label} id={id} wide error={error} optional={optional}>
      <textarea
        id={id}
        data-field={k}
        rows={4}
        value={value}
        maxLength={max}
        onChange={(e) => set(k, e.target.value)}
        required={!optional}
        aria-invalid={Boolean(error)}
        aria-describedby={`${counterId}${error ? ` ${id}-error` : ''}`}
      />
      <span id={counterId} className={styles.counter}>
        {value.length} / {max}
      </span>
    </Field>
  )
}

function CheckField({
  k,
  label,
  fields,
  errors,
  set,
}: {
  k: 'commitSixMonths' | 'consent'
  label: ReactNode
  fields: ApplicationInput
  errors: FieldErrors
  set: SetFn
}) {
  const id = `app-${k}`
  const error = errors[k]
  return (
    <div className={`${styles.checkRow} ${styles.fieldWide}`}>
      <input
        id={id}
        data-field={k}
        type="checkbox"
        checked={fields[k] === true}
        onChange={(e) => set(k, e.target.checked)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        required
      />
      <label htmlFor={id}>{label}</label>
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  )
}

function UploadStatus({ upload, humanCheck }: { upload: UploadState; humanCheck: TurnstileStatus }) {
  if (upload.status === 'idle') {
    return <span id="app-resume-status" className={styles.uploadHint}>Uploads as soon as you pick it.</span>
  }
  if (upload.status === 'verifying') {
    return (
      <span id="app-resume-status" className={humanCheck === 'interactive' ? styles.uploadAction : styles.uploadHint} role="status">
        {humanCheck === 'interactive'
          ? 'One step: tick “Verify you are human” just below, and your CV will upload.'
          : `Getting ready to upload ${upload.fileName}…`}
      </span>
    )
  }
  if (upload.status === 'uploading') {
    return (
      <div id="app-resume-status" className={styles.upload}>
        <div
          className={styles.progress}
          role="progressbar"
          aria-label="CV upload"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={upload.progress}
        >
          <span style={{ width: `${upload.progress}%` }} />
        </div>
        <span className={styles.uploadHint}>Uploading {upload.fileName}… {upload.progress}%</span>
      </div>
    )
  }
  if (upload.status === 'done') {
    return (
      <span id="app-resume-status" className={styles.uploadDone}>
        ✓ {upload.fileName} uploaded
      </span>
    )
  }
  return (
    <span id="app-resume-status" className={styles.fieldError}>
      {upload.message}
    </span>
  )
}
