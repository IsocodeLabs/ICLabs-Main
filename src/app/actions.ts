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
