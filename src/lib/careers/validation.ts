/**
 * Round 1 application fields + validation — shared by the form (instant
 * feedback) and the API (the real gate). Plain TypeScript, no server imports,
 * so it bundles for the browser.
 */
import type { RoleKind } from '@/lib/seed-data'

export const RESUME_MAX_BYTES = 5 * 1024 * 1024
export const RESUME_CONTENT_TYPE = 'application/pdf'

export const INTEREST_AREAS = [
  { label: 'Engineering', value: 'engineering' },
  { label: 'Product', value: 'product' },
  { label: 'Design', value: 'design' },
  { label: 'Growth', value: 'growth' },
  { label: 'Other', value: 'other' },
] as const

export const LIMITS = {
  name: 120,
  email: 200,
  phone: 20,
  college: 160,
  url: 300,
  pitchNote: 300,
  why: 500,
} as const

/** What the form sends (every value a string or boolean, all optional on the wire). */
export type ApplicationInput = {
  name?: string
  email?: string
  phone?: string
  college?: string
  gradYear?: string
  startDate?: string
  commitSixMonths?: boolean
  consent?: boolean
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  projectUrl?: string
  pitchNote?: string
  why?: string
  interestArea?: string
}

export type CleanApplication = {
  name: string
  email: string
  phone: string
  college: string
  gradYear: number
  startDate: string
  commitSixMonths: boolean
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
  projectUrl: string
  pitchNote: string
  why: string
  interestArea: string
}

export type FieldErrors = Partial<Record<keyof ApplicationInput | 'resume' | 'links', string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Which optional/required extras a role kind asks for. */
export function fieldsFor(kind: RoleKind) {
  return {
    commit: kind !== 'open',
    linkedin: kind === 'growth' || kind === 'pm' ? 'required' : kind === 'open' ? 'oneOf' : null,
    github: kind === 'sde' ? 'required' : kind === 'open' ? 'oneOf' : null,
    portfolio: kind === 'pm' ? 'optional' : kind === 'open' ? 'oneOf' : null,
    project: kind === 'sde' ? 'optional' : null,
    pitchNote: kind === 'growth',
    why: kind === 'open',
    interestArea: kind === 'open',
  } as const
}

function checkUrl(value: string, host?: string): string | null {
  if (value.length > LIMITS.url) return 'That link is too long.'
  let u: URL
  try {
    u = new URL(value)
  } catch {
    return 'That doesn’t look like a full link — include https://'
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return 'Links need to start with https://'
  if (host && !(u.hostname === host || u.hostname.endsWith(`.${host}`))) {
    return `This should be a ${host} link.`
  }
  return null
}

export function minStartDate(today = new Date()) {
  return new Date(today.getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10)
}

export function maxGradYear(today = new Date()) {
  return today.getFullYear() + 6
}

export function validateApplication(
  raw: ApplicationInput,
  kind: RoleKind,
  today = new Date(),
): { ok: true; data: CleanApplication } | { ok: false; errors: FieldErrors } {
  const f = fieldsFor(kind)
  const errors: FieldErrors = {}

  const name = str(raw.name)
  const email = str(raw.email).toLowerCase()
  const phone = str(raw.phone)
  const college = str(raw.college)
  const gradYearRaw = str(raw.gradYear)
  const startDate = str(raw.startDate)
  const linkedinUrl = f.linkedin ? str(raw.linkedinUrl) : ''
  const githubUrl = f.github ? str(raw.githubUrl) : ''
  const portfolioUrl = f.portfolio ? str(raw.portfolioUrl) : ''
  const projectUrl = f.project ? str(raw.projectUrl) : ''
  const pitchNote = f.pitchNote ? str(raw.pitchNote) : ''
  const why = f.why ? str(raw.why) : ''
  const interestArea = f.interestArea ? str(raw.interestArea) : ''

  if (!name) errors.name = 'Please add your full name.'
  else if (name.length > LIMITS.name) errors.name = 'That name is too long.'

  if (!EMAIL_RE.test(email) || email.length > LIMITS.email) {
    errors.email = 'That email doesn’t look complete — mind checking it?'
  }

  const digits = phone.replace(/[\s\-()]/g, '')
  if (!phone) errors.phone = 'Please add a WhatsApp number.'
  else if (!/^\+?\d{10,15}$/.test(digits) || phone.length > LIMITS.phone) {
    errors.phone = 'Use 10–15 digits, with a country code if outside India.'
  }

  if (!college) errors.college = 'Please add your college or university.'
  else if (college.length > LIMITS.college) errors.college = 'That’s too long.'

  const gradYear = Number(gradYearRaw)
  if (!gradYearRaw) errors.gradYear = 'Please add your graduation year.'
  else if (!Number.isInteger(gradYear) || gradYear < 2000 || gradYear > maxGradYear(today)) {
    errors.gradYear = 'Use a four-digit year, e.g. 2027.'
  }

  if (!startDate) errors.startDate = 'Please pick your earliest start date.'
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(Date.parse(startDate))) {
    errors.startDate = 'Please pick a valid date.'
  } else {
    const maxDate = new Date(today.getTime() + 2 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    if (startDate < minStartDate(today) || startDate > maxDate) {
      errors.startDate = 'Pick a date between today and two years from now.'
    }
  }

  if (f.commit && raw.commitSixMonths !== true) {
    errors.commitSixMonths = 'This role needs a 6-month, remote commitment.'
  }
  if (raw.consent !== true) errors.consent = 'Please agree to the privacy notice to apply.'

  const urlField = (
    key: 'linkedinUrl' | 'githubUrl' | 'portfolioUrl' | 'projectUrl',
    value: string,
    mode: string | null,
    host?: string,
  ) => {
    if (!mode) return
    if (!value) {
      if (mode === 'required') {
        errors[key] = host === 'github.com' ? 'Please add your GitHub link.' : 'Please add your LinkedIn link.'
      }
      return
    }
    const err = checkUrl(value, host)
    if (err) errors[key] = err
  }
  urlField('linkedinUrl', linkedinUrl, f.linkedin, 'linkedin.com')
  urlField('githubUrl', githubUrl, f.github, 'github.com')
  urlField('portfolioUrl', portfolioUrl, f.portfolio)
  urlField('projectUrl', projectUrl, f.project)
  // Open application: LinkedIn, GitHub and portfolio are all genuinely optional.
  // (An earlier rule demanded at least one while every field was labelled
  // "optional", which blocked submissions with no visible reason.)

  if (pitchNote.length > LIMITS.pitchNote) errors.pitchNote = `Keep it under ${LIMITS.pitchNote} characters.`
  if (f.why) {
    if (!why) errors.why = 'Tell us what you’d do at Isocode.'
    else if (why.length > LIMITS.why) errors.why = `Keep it under ${LIMITS.why} characters.`
  }
  if (f.interestArea && !INTEREST_AREAS.some((a) => a.value === interestArea)) {
    errors.interestArea = 'Pick the area closest to what you do.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    data: {
      name,
      email,
      phone: digits,
      college,
      gradYear,
      startDate,
      commitSixMonths: f.commit ? true : false,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      projectUrl,
      pitchNote,
      why,
      interestArea,
    },
  }
}

export function validateResumeFile(file: { size: number; type: string; name: string }): string | null {
  const looksPdf = file.type === RESUME_CONTENT_TYPE || /\.pdf$/i.test(file.name)
  if (!looksPdf) return 'Your CV needs to be a PDF file.'
  if (file.size === 0) return 'That file is empty — pick your CV again.'
  if (file.size > RESUME_MAX_BYTES) return 'That PDF is over 5 MB — mind compressing it?'
  return null
}
