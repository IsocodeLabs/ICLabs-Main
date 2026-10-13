'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { leadNotificationHtml, notifyFounders } from '@/lib/notify'
import { contactChannels } from '@/lib/seed-data'

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

/** How long the database gets before we fall back to email. */
const SAVE_TIMEOUT_MS = 8000

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

function clean(s: unknown, max = 500): string {
  return typeof s === 'string' ? s.trim().slice(0, max) : ''
}

export async function submitLead(
  input: SubmitLeadInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
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

  const kind = input.kind === 'shortQuiz' ? 'shortQuiz' : 'contact'
  const answers = (input.answers ?? []).slice(0, 40).map((a) => ({
    questionId: a.questionId,
    prompt: clean(a.prompt, 300),
    optionLabel: clean(a.optionLabel, 200),
    optionValue: clean(a.optionValue, 100),
    signalKey: clean(a.signalKey, 40),
    signalValue: clean(a.signalValue, 60),
  }))

  const signal = (key: string) => answers.find((a) => a.signalKey === key)?.optionValue

  try {
    await withTimeout(
      (async () => {
        const payload = await getPayload({ config })
        await payload.create({
          collection: 'lead-submissions',
          overrideAccess: true,
          data: {
            kind,
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
      })(),
      SAVE_TIMEOUT_MS,
    )
    return { ok: true }
  } catch (err) {
    console.error('[submitLead] could not save the lead', err)
  }

  // The database is unreachable. Don't turn a real enquiry away: email it to the
  // founders so it isn't lost, and only show an error if that fails too.
  const delivered = await notifyFounders(
    `${kind === 'shortQuiz' ? 'Quiz submission' : 'Enquiry'} — ${name} (not saved to admin)`,
    leadNotificationHtml({ kind, name, email, company, note, answers, unsaved: true }),
  )
  if (delivered) return { ok: true }

  return {
    ok: false,
    error: `Something went wrong on our side — nothing you did. Please email ${contactChannels.email} and we’ll pick it up.`,
  }
}

// Job applications no longer go through a server action: see
// src/app/api/careers/{upload-url,apply} (direct-to-bucket CV uploads).
