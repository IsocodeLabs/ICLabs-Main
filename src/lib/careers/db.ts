import type { Pool } from 'pg'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

/** The cached Payload instance (one per Cloud Run instance) and its pg pool. */
export async function payloadInstance(): Promise<Payload> {
  return getPayload({ config })
}

export function pgPool(payload: Payload): Pool {
  return (payload.db as unknown as { pool: Pool }).pool
}
