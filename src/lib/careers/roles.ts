import type { Payload } from 'payload'
import type { JobOpening } from '@/payload-types'

/**
 * Role lookups for the API. Cached per instance for a few seconds so a burst of
 * 1,000 submissions doesn't do 1,000 identical role reads — a paused/closed
 * status still takes effect within ROLE_TTL_MS everywhere.
 */
const ROLE_TTL_MS = 10_000
let cache: { at: number; roles: JobOpening[] } | null = null

export async function getRolesFresh(payload: Payload): Promise<JobOpening[]> {
  if (cache && Date.now() - cache.at < ROLE_TTL_MS) return cache.roles
  const res = await payload.find({
    collection: 'job-openings',
    where: { slug: { exists: true } },
    limit: 100,
    depth: 0,
  })
  cache = { at: Date.now(), roles: res.docs }
  return res.docs
}

export function invalidateRoleCache() {
  cache = null
}

export async function findOpenRole(payload: Payload, roleKey: string) {
  const roles = await getRolesFresh(payload)
  const role = roles.find((r) => r.roleKey === roleKey)
  if (!role) return { role: null, error: 'unknown_role' as const }
  if (role.status !== 'open') return { role, error: 'role_not_open' as const }
  return { role, error: null }
}
