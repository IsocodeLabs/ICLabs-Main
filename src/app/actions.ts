'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Lead intake — the only write path from the public site. Server-side only,
 * validated here; the collection itself refuses public creates.
 */

export type QuizAnswer = {
  questionId?: string | number
  prompt: string
  optionLabel: string
  optionValue: string
  signalKey: string
  signalValue?: string
}

export type LeadContact = {
  name: string
  email: string
  company?: string
  note?: string
}

type SubmitLeadInput = {
  kind: 'shortQuiz' | 'contact'
  answers?: QuizAnswer[]
  contact: LeadContact
  /** honeypot — must be empty */
  website?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function clean(s: unknown, max = 500): string {
  return typeof s === 'string' ? s.trim().slice(0, max) : ''
}

export async function submitLead(
  input: SubmitLeadInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // honeypot: pretend success, store nothing
    if (input.website) return { ok: true }

    const name = clean(input.contact?.name, 120)
    const email = clean(input.contact?.email, 200)
    const company = clean(input.contact?.company, 160)
    const note = clean(input.contact?.note, 2000)

    if (!name) return { ok: false, error: 'We need a name to know who to write back to.' }
    if (!EMAIL_RE.test(email)) {
      return { ok: false, error: 'That email doesn’t look complete — mind checking it?' }
    }

    const answers = (input.answers ?? []).slice(0, 40).map((a) => ({
      questionId: a.questionId,
      prompt: clean(a.prompt, 300),
      optionLabel: clean(a.optionLabel, 200),
      optionValue: clean(a.optionValue, 100),
      signalKey: clean(a.signalKey, 40),
      signalValue: clean(a.signalValue, 60),
    }))

    const signal = (key: string) => answers.find((a) => a.signalKey === key)?.optionValue

    const payload = await getPayload({ config })
    await payload.create({
      collection: 'lead-submissions',
      overrideAccess: true,
      data: {
        kind: input.kind === 'shortQuiz' ? 'shortQuiz' : 'contact',
        answers,
        contact: { name, email, company, note },
        status: 'new',
        dealBreakerFlag: answers.some((a) => a.signalValue === 'costFirst'),
        derived: {
          companySize: signal('companySize'),
          context: signal('context'),
          aspiration: signal('aspiration'),
        },
      },
    })

    return { ok: true }
  } catch (err) {
    console.error('[submitLead]', err)
    return {
      ok: false,
      error: 'Something went wrong on our side — nothing you did. Try again, or email us directly.',
    }
  }
}

/**
 * Job-application intake — the careers write path. Takes FormData (so the résumé
 * PDF rides along), validates here, uploads the file to the private Resumes
 * collection, then writes an Applications doc. Same discipline as submitLead:
 * honeypot, email regex, length caps, server-side overrideAccess. The résumé is
 * PDF-only and capped at 5 MB. Public direct writes to either collection are
 * refused (create: noOne).
 */
const RESUME_MAX_BYTES = 5 * 1024 * 1024
const RESERVED_APP_KEYS = new Set(['name', 'email', 'role', 'roleTitle', 'website', 'resume'])

export async function submitApplication(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // honeypot: pretend success, store nothing
    if (clean(formData.get('website'), 200)) return { ok: true }

    const name = clean(formData.get('name'), 120)
    const email = clean(formData.get('email'), 200)
    const role = clean(formData.get('role'), 60) || 'open'
    const roleTitle = clean(formData.get('roleTitle'), 160)

    if (!name) return { ok: false, error: 'We need a name to know who applied.' }
    if (!EMAIL_RE.test(email)) {
      return { ok: false, error: 'That email doesn’t look complete — mind checking it?' }
    }

    // capture every non-reserved field (incl. any CMS-added ones) as answers
    const answers: Record<string, string> = {}
    for (const [key, value] of formData.entries()) {
      if (RESERVED_APP_KEYS.has(key)) continue
      const v = clean(value, 4000)
      if (v) answers[key] = v
    }

    // résumé: required, PDF only, size-capped
    const file = formData.get('resume')
    const isFile = file && typeof file === 'object' && 'arrayBuffer' in file
    const resumeFile = isFile ? (file as File) : null
    if (!resumeFile || resumeFile.size === 0) {
      return { ok: false, error: 'Please attach your résumé as a PDF.' }
    }
    if (resumeFile.type !== 'application/pdf') {
      return { ok: false, error: 'Your résumé needs to be a PDF file.' }
    }
    if (resumeFile.size > RESUME_MAX_BYTES) {
      return { ok: false, error: 'That résumé is over 5 MB — mind compressing it?' }
    }

    const payload = await getPayload({ config })

    const buffer = Buffer.from(await resumeFile.arrayBuffer())
    const uploaded = await payload.create({
      collection: 'resumes',
      overrideAccess: true,
      data: { applicantName: name },
      file: {
        data: buffer,
        mimetype: 'application/pdf',
        name: resumeFile.name || `${name.replace(/\s+/g, '-').toLowerCase()}-resume.pdf`,
        size: resumeFile.size,
      },
    })

    await payload.create({
      collection: 'applications',
      overrideAccess: true,
      data: {
        name,
        email,
        role,
        roleTitle,
        college: answers.college,
        year: answers.year,
        portfolioUrl: answers.portfolioUrl,
        why: answers.why,
        resume: uploaded.id,
        answers,
        status: 'new',
      },
    })

    return { ok: true }
  } catch (err) {
    console.error('[submitApplication]', err)
    return {
      ok: false,
      error: 'Something went wrong on our side — nothing you did. Try again, or email us directly.',
    }
  }
}
