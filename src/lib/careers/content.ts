import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
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
    stipendShort: o.stipendShort ?? '',
    baseSalaryMonthlyINR: o.baseSalaryMonthlyINR ?? null,
    eyebrow: o.eyebrow ?? '',
    blurb: o.blurb ?? '',
    about: o.about ?? '',
    responsibilities: list(o.responsibilities),
    lookingFor: list(o.lookingFor),
    niceToHave: list(o.niceToHave),
    startNote: o.startNote ?? '',
    seoTitle: o.seoTitle ?? '',
    seoDescription: o.seoDescription ?? '',
    ogTitle: o.ogTitle ?? '',
    ogDescription: o.ogDescription ?? '',
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
  return { page: careersContent, roles: await getCareerRoles() }
}

export async function getCareerRole(slug: string): Promise<CareerRole | null> {
  const roles = await getCareerRoles()
  return roles.find((r) => r.slug === slug && r.roleKind !== 'open') ?? null
}

/** Named roles that show a card: open + paused (closed/archived are hidden). */
export const visibleRoleCards = (roles: CareerRole[]) =>
  roles.filter((r) => r.roleKind !== 'open' && (r.status === 'open' || r.status === 'paused'))

/** The open application (main page form), when it is accepting applications. */
export const openApplicationRole = (roles: CareerRole[]) =>
  roles.find((r) => r.roleKind === 'open' && r.status === 'open') ?? null
