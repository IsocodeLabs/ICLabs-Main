import { revalidatePath } from 'next/cache'

/**
 * Refresh the careers pages after a role changes. Best effort: outside a Next
 * request (seed / migration scripts) revalidatePath throws, and that must never
 * fail the write — the pages' 60 s ISR window catches up on its own.
 */
export function revalidateCareers(slugs: (string | null | undefined)[] = []) {
  const paths = ['/careers', '/sitemap.xml']
  for (const slug of new Set(slugs.filter(Boolean))) paths.push(`/careers/roles/${slug}`)
  for (const p of paths) {
    try {
      revalidatePath(p)
    } catch {
      // not in a Next request context — nothing to revalidate
    }
  }
}
