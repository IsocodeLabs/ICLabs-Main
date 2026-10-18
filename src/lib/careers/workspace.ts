import { createHmac } from 'node:crypto'

/**
 * Hand-off to the hiring workspace (workspace.isocodelabs.com). Founders pick
 * shortlisted applicants on the screening desk and click "Invite to workspace";
 * the workspace creates their account and emails them a login.
 *
 * Requests are signed with the secret both apps share: HMAC-SHA256 over
 * `${timestamp}.${body}`, sent as x-careers-timestamp / x-careers-signature.
 * The workspace refuses anything older than 5 minutes. Sending the same person
 * twice is harmless — the workspace answers "already".
 */
export const WORKSPACE_TAG = 'workspace-invited'
export const MAX_PER_INVITE = 100

export const workspaceConfig = {
  url: (process.env.WORKSPACE_URL || 'https://workspace.isocodelabs.com').replace(/\/$/, ''),
  secret: process.env.CAREERS_WORKSPACE_SECRET || '',
}

export const workspaceConfigured = () => workspaceConfig.secret.length >= 32

export type WorkspaceCandidate = {
  applicationId: number
  name: string
  email: string
  phone?: string | null
  roleKey: string
  roleTitle?: string | null
  college?: string | null
  gradYear?: number | null
  linkedin?: string | null
  github?: string | null
  shortlistedBy?: string | null
  /** already invited: send a fresh login email (new temporary password) */
  resendLogin?: boolean
}

export type WorkspaceResult = { applicationId: string | null } & (
  | { status: 'invited' | 'role_added' | 'already' | 'resent'; role: string }
  | { status: 'error'; reason: string }
)

export function signWorkspaceRequest(secret: string, timestamp: string, body: string) {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
}

/** One signed POST for the whole batch. Throws when the workspace can't be reached or refuses the call. */
export async function inviteToWorkspace(candidates: WorkspaceCandidate[]): Promise<WorkspaceResult[]> {
  // drop empty optional fields so the workspace only sees what we have
  const clean = candidates.map((c) =>
    Object.fromEntries(Object.entries(c).filter(([, v]) => v !== null && v !== undefined && v !== '')),
  )
  const body = JSON.stringify({ candidates: clean })
  const timestamp = String(Date.now())
  const res = await fetch(`${workspaceConfig.url}/api/integrations/careers/invite`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-careers-timestamp': timestamp,
      'x-careers-signature': signWorkspaceRequest(workspaceConfig.secret, timestamp, body),
    },
    body,
    signal: AbortSignal.timeout(60_000),
  })
  const data = (await res.json().catch(() => ({}))) as { results?: WorkspaceResult[]; error?: string }
  if (!res.ok || !Array.isArray(data.results)) {
    throw new Error(data.error ? `workspace said: ${data.error}` : `workspace returned ${res.status}`)
  }
  return data.results
}
