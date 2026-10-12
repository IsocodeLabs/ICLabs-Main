import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import { ScreeningApp } from './ScreeningApp'

/**
 * /admin/screening — the founders' screening desk (FR10–FR13). A custom
 * Payload admin view: same login and admin chrome, but a sheet-like workspace
 * built for going through thousands of Round 1 applications quickly.
 * Custom views aren't auth-gated by Payload, so this checks the user itself.
 */
export async function ScreeningView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  if (!req.user) redirect(`${req.payload.config.routes.admin}/login?redirect=${encodeURIComponent('/admin/screening')}`)

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={{ collections: visibleEntities?.collections, globals: visibleEntities?.globals }}
    >
      <Gutter>
        <ScreeningApp initialFilters={filtersFromSearch(searchParams)} />
      </Gutter>
    </DefaultTemplate>
  )
}

const FILTER_KEYS = ['role', 'stage', 'cycle', 'gradYear', 'college', 'ratingMin', 'unrated', 'tag', 'from', 'to', 'q', 'sort']

function filtersFromSearch(sp: AdminViewServerProps['searchParams']): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of FILTER_KEYS) {
    const v = sp?.[k]
    if (typeof v === 'string' && v) out[k] = v.slice(0, 200)
  }
  return out
}

export default ScreeningView
