import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  applicationForm,
  careerRoles,
  careersContent,
  type CareerRoleSeed,
  type RoleKind,
  type RoleStatus,
} from '@/lib/seed-data'
import type { JobOpening } from '@/payload-types'

export type { RoleKind, RoleStatus }
export type CareerRole = CareerRoleSeed

export type CareersContent = {
  page: typeof careersContent
  /** every non-archived role (incl. the open application), sorted by order */
  roles: CareerRole[]
  formIntro: string
}

const list = (rows?: { text?: string | null }[] | null) =>
  (rows ?? []).map((r) => r.text ?? '').filter(Boolean)

function toRole(o: JobOpening): CareerRole {
  return {
    title: o.title,
    slug: o.slug ?? o.roleKey,
    roleKey: o.roleKey,
    order: o.order ?? 0,
    status: (o.status ?? 'open') as RoleStatus,
    roleKind: (o.roleKind ?? 'sde') as RoleKind,
    type: (o.type ?? 'intern') as CareerRole['type'],
    dept: o.dept ?? '',
    location: o.location ?? 'Remote',
    duration: o.duration ?? '',
    payLine: o.payLine ?? '',
    baseSalaryMonthlyINR: o.baseSalaryMonthlyINR ?? null,
    blurb: o.blurb ?? '',
    about: o.about ?? '',
    responsibilities: list(o.responsibilities),
    lookingFor: list(o.lookingFor),
    stack: list(o.stack),
    compensation: o.compensation ?? '',
    footnote: o.footnote ?? '',
    hiringProcess: (o.hiringProcess ?? []).map((s) => ({
      title: s.title,
      description: s.description ?? '',
    })),
    datePosted: o.datePosted ?? o.createdAt,
    validThrough: o.validThrough ?? null,
    applicationCap: o.applicationCap ?? null,
  }
}

/**
 * All roles the careers site knows about (archived excluded). Falls back to the
 * seed roles when the CMS is unreachable *or* hasn't been migrated to v2 yet
 * (no role has a slug), so the site never renders blank or pre-v2 roles.
 */
export const getCareerRoles = cache(async (): Promise<CareerRole[]> => {
  const fallback = careerRoles.filter((r) => r.status !== 'archived')
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'job-openings',
      where: { and: [{ status: { not_equals: 'archived' } }, { slug: { exists: true } }] },
      sort: 'order',
      limit: 100,
      depth: 0,
    })
    return res.docs.length > 0 ? res.docs.map(toRole) : fallback
  } catch {
    return fallback
  }
})

export async function getCareersContent(): Promise<CareersContent> {
  const roles = await getCareerRoles()
  let formIntro = applicationForm.intro
  try {
    const payload = await getPayload({ config })
    const form = await payload.findGlobal({ slug: 'application-form', depth: 0 })
    if (form?.intro) formIntro = form.intro
  } catch {
    // fallback intro
  }
  return { page: careersContent, roles, formIntro }
}

export async function getCareerRole(slug: string): Promise<CareerRole | null> {
  const roles = await getCareerRoles()
  return roles.find((r) => r.slug === slug && r.roleKind !== 'open') ?? null
}

/**
 * The pay line on a role card. Business Growth's full line (target + commission
 * terms) stays on its role page and in the data; the card carries a short form.
 */
export const cardPayLine = (role: CareerRole) =>
  role.roleKind === 'growth' ? '₹1 lakh/month + commission' : role.payLine

/** Named roles that show a card: open + paused (closed/archived are hidden). */
export const visibleRoleCards = (roles: CareerRole[]) =>
  roles.filter((r) => r.roleKind !== 'open' && (r.status === 'open' || r.status === 'paused'))

/** Roles the form's dropdown offers: open named roles, then the open application if open. */
export const applyableRoles = (roles: CareerRole[]) => [
  ...roles.filter((r) => r.roleKind !== 'open' && r.status === 'open'),
  ...roles.filter((r) => r.roleKind === 'open' && r.status === 'open'),
]
