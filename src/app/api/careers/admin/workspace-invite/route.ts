import { requireAdmin } from '@/lib/careers/admin'
import { hashId } from '@/lib/careers/crypto'
import { logError, logInfo } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'
import {
  inviteToWorkspace,
  MAX_PER_INVITE,
  workspaceConfigured,
  WORKSPACE_TAG,
} from '@/lib/careers/workspace'

export const dynamic = 'force-dynamic'

// one hand-off at a time per server instance — stops a double click sending twice
let sending = false

/**
 * "Invite to workspace" for the selected applicants. Only Shortlisted people are
 * sent; anyone already tagged `workspace-invited` is skipped unless `resend`, which
 * asks the workspace to email them a fresh login (new temporary password).
 * `preview: true` only counts. Everyone the workspace accepts gets the tag.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload, user } = auth

  const body = (await req.json().catch(() => ({}))) as { ids?: unknown[]; preview?: boolean; resend?: boolean }
  const ids = (Array.isArray(body.ids) ? body.ids : []).filter((n): n is number => Number.isInteger(n)).slice(0, 1000)
  if (ids.length === 0) return json({ ok: false, error: 'Nobody selected.' }, 400)

  if (!workspaceConfigured()) {
    return json({ ok: false, error: 'The workspace isn’t connected yet — CAREERS_WORKSPACE_SECRET is not set.' }, 503)
  }

  try {
    const found = await payload.find({
      collection: 'applications',
      where: { id: { in: ids } },
      limit: 1000,
      depth: 0,
      pagination: false,
      overrideAccess: true,
      select: {
        name: true,
        email: true,
        phone: true,
        role: true,
        roleTitle: true,
        college: true,
        gradYear: true,
        linkedinUrl: true,
        githubUrl: true,
        stage: true,
        tags: true,
      },
    })

    const skipped = { notShortlisted: 0, alreadyInvited: 0 }
    const eligible = found.docs.filter((d) => {
      if (d.stage !== 'shortlisted') {
        skipped.notShortlisted++
        return false
      }
      if (!body.resend && (d.tags ?? []).includes(WORKSPACE_TAG)) {
        skipped.alreadyInvited++
        return false
      }
      return true
    })

    if (body.preview) return json({ ok: true, recipients: eligible.length, skipped, limit: MAX_PER_INVITE })
    if (eligible.length === 0) return json({ ok: true, invited: 0, already: 0, failed: [], skipped })
    if (eligible.length > MAX_PER_INVITE) {
      return json(
        { ok: false, error: `That’s ${eligible.length} people — invite up to ${MAX_PER_INVITE} at a time.` },
        400,
      )
    }

    if (sending) return json({ ok: false, error: 'An invite is already in progress — wait a moment.' }, 409)
    sending = true
    try {
      const results = await inviteToWorkspace(
        eligible.map((d) => ({
          applicationId: d.id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          roleKey: String(d.role ?? ''),
          roleTitle: d.roleTitle,
          college: d.college,
          gradYear: d.gradYear,
          linkedin: d.linkedinUrl,
          github: d.githubUrl,
          shortlistedBy: user.email,
          resendLogin: body.resend === true && (d.tags ?? []).includes(WORKSPACE_TAG),
        })),
      )

      const byId = new Map(results.map((r) => [String(r.applicationId), r]))
      const done = eligible.filter((d) => {
        const r = byId.get(String(d.id))
        return r && r.status !== 'error'
      })
      const failed = eligible.flatMap((d) => {
        const r = byId.get(String(d.id))
        if (r && r.status !== 'error') return []
        return [{ name: d.name, reason: r && r.status === 'error' ? r.reason : 'No answer from the workspace' }]
      })

      // remember who is in the workspace, a few at a time
      for (let i = 0; i < done.length; i += 10) {
        await Promise.all(
          done.slice(i, i + 10).map((d) =>
            payload.update({
              collection: 'applications',
              id: d.id,
              data: { tags: [...new Set([...(d.tags ?? []), WORKSPACE_TAG])] },
              user,
              overrideAccess: true,
              depth: 0,
              select: { tags: true },
            }),
          ),
        )
      }

      const already = results.filter((r) => r.status === 'already').length
      const resent = results.filter((r) => r.status === 'resent').length
      logInfo('workspace_invited', {
        actor: hashId(String(user.id)),
        invited: done.length - already - resent,
        already,
        resent,
        failed: failed.length,
        ...skipped,
      })
      return json({ ok: true, invited: done.length - already - resent, already, resent, failed, skipped })
    } finally {
      sending = false
    }
  } catch (err) {
    logError('workspace_invite_failed', err, { actor: hashId(String(user.id)) })
    return json({ ok: false, error: 'Couldn’t reach the workspace — try again in a minute.' }, 502)
  }
}
