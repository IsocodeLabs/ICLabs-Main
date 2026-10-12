import { createReadStream, createWriteStream, mkdirSync } from 'node:fs'
import { copyFile, mkdir, open, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import type { Readable, Writable } from 'node:stream'
import { Storage, type Bucket } from '@google-cloud/storage'
import { assertStorageConfigured, careersConfig } from './config'
import { hmac, verifyHmac } from './crypto'

/**
 * Résumé object storage. Production: one private GCS bucket in asia-south1
 * (Mumbai) — uniform access, public access prevention enforced, versioning on,
 * Google-managed encryption at rest (scripts/careers-gcs-setup.ts sets it up).
 *
 * Layout:
 *   pending/{yyyy-mm}/{uuid}.pdf          browser uploads land here; lifecycle-expired after 2 days
 *   applications/{roleSlug}/{submissionId}.pdf   submitted CVs; never auto-expire
 *   exports/{uuid}.zip                    admin ZIP exports; lifecycle-expired after 1 day
 *
 * Browsers upload straight to the bucket with a signed POST policy (size and
 * content type enforced by GCS itself) — CVs never stream through Cloud Run.
 *
 * Dev: CAREERS_STORAGE=local mimics the same contract on disk under
 * .local/storage, with HMAC-signed URLs served by /api/careers/dev-storage.
 */
export type UploadSlot = { url: string; fields: Record<string, string> }

export interface CareersStorage {
  createUploadSlot(key: string, opts: { maxBytes: number; contentType: string; expiresInSeconds: number }): Promise<UploadSlot>
  stat(key: string): Promise<{ size: number; contentType?: string } | null>
  readHead(key: string, bytes: number): Promise<Buffer>
  copy(from: string, to: string): Promise<void>
  /** delete the live object (a versioned bucket keeps a noncurrent copy) */
  remove(key: string): Promise<void>
  /** delete every stored version — only for applicant deletion requests */
  purge(key: string): Promise<void>
  signedReadUrl(key: string, opts: { expiresInSeconds: number; filename?: string; inline?: boolean }): Promise<string>
  readStream(key: string): Readable
  writeStream(key: string, contentType: string): Writable
}

// ── GCS ──────────────────────────────────────────────────────────────────────

let gcsBucket: Bucket | null = null
function bucket(): Bucket {
  if (!gcsBucket) gcsBucket = new Storage().bucket(careersConfig.bucket)
  return gcsBucket
}

const gcs: CareersStorage = {
  async createUploadSlot(key, { maxBytes, contentType, expiresInSeconds }) {
    const [policy] = await bucket()
      .file(key)
      .generateSignedPostPolicyV4({
        expires: Date.now() + expiresInSeconds * 1000,
        conditions: [
          ['content-length-range', 1, maxBytes],
          ['eq', '$Content-Type', contentType],
        ],
        fields: { 'Content-Type': contentType, success_action_status: '201' },
      })
    return { url: policy.url, fields: policy.fields }
  },
  async stat(key) {
    try {
      const [meta] = await bucket().file(key).getMetadata()
      return { size: Number(meta.size), contentType: meta.contentType }
    } catch (err) {
      if ((err as { code?: number }).code === 404) return null
      throw err
    }
  },
  async readHead(key, bytes) {
    const [buf] = await bucket().file(key).download({ start: 0, end: bytes - 1 })
    return buf
  },
  async copy(from, to) {
    await bucket().file(from).copy(bucket().file(to))
  },
  async remove(key) {
    await bucket().file(key).delete({ ignoreNotFound: true })
  },
  async purge(key) {
    const [files] = await bucket().getFiles({ prefix: key, versions: true })
    await Promise.all(
      files
        .filter((f) => f.name === key)
        .map((f) => bucket().file(f.name, { generation: f.metadata.generation }).delete({ ignoreNotFound: true })),
    )
  },
  async signedReadUrl(key, { expiresInSeconds, filename, inline = true }) {
    const disposition = `${inline ? 'inline' : 'attachment'}${filename ? `; filename="${filename.replace(/"/g, '')}"` : ''}`
    const [url] = await bucket()
      .file(key)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
        responseDisposition: disposition,
      })
    return url
  },
  readStream(key) {
    return bucket().file(key).createReadStream()
  },
  writeStream(key, contentType) {
    return bucket().file(key).createWriteStream({ contentType, resumable: false })
  },
}

// ── local (dev only) ─────────────────────────────────────────────────────────

const LOCAL_ROOT = path.resolve(process.cwd(), process.env.CAREERS_LOCAL_STORAGE_DIR || '.local/storage')

function localPath(key: string): string {
  const p = path.resolve(LOCAL_ROOT, key)
  if (!p.startsWith(LOCAL_ROOT + path.sep)) throw new Error('invalid key')
  return p
}

/** dev signed URL: /api/careers/dev-storage?op=…&key=…&exp=…&sig=… */
export function devSign(op: 'put' | 'get', key: string, exp: number, extra = '') {
  return hmac(`dev-storage:${op}:${key}:${exp}:${extra}`)
}
export function devVerify(op: 'put' | 'get', key: string, exp: number, sig: string, extra = '') {
  return exp > Date.now() && verifyHmac(`dev-storage:${op}:${key}:${exp}:${extra}`, sig)
}

const local: CareersStorage = {
  async createUploadSlot(key, { maxBytes, contentType, expiresInSeconds }) {
    const exp = Date.now() + expiresInSeconds * 1000
    const extra = `${maxBytes}:${contentType}`
    return {
      url: '/api/careers/dev-storage',
      fields: {
        key,
        exp: String(exp),
        max: String(maxBytes),
        'Content-Type': contentType,
        sig: devSign('put', key, exp, extra),
      },
    }
  },
  async stat(key) {
    try {
      const s = await stat(localPath(key))
      return { size: s.size, contentType: 'application/pdf' }
    } catch {
      return null
    }
  },
  async readHead(key, bytes) {
    const fh = await open(localPath(key), 'r')
    try {
      const buf = Buffer.alloc(bytes)
      const { bytesRead } = await fh.read(buf, 0, bytes, 0)
      return buf.subarray(0, bytesRead)
    } finally {
      await fh.close()
    }
  },
  async copy(from, to) {
    await mkdir(path.dirname(localPath(to)), { recursive: true })
    await copyFile(localPath(from), localPath(to))
  },
  async remove(key) {
    await rm(localPath(key), { force: true })
  },
  async purge(key) {
    await rm(localPath(key), { force: true })
  },
  async signedReadUrl(key, { expiresInSeconds, filename, inline = true }) {
    const exp = Date.now() + expiresInSeconds * 1000
    const q = new URLSearchParams({
      op: 'get',
      key,
      exp: String(exp),
      sig: devSign('get', key, exp),
      disposition: inline ? 'inline' : 'attachment',
    })
    if (filename) q.set('filename', filename)
    return `/api/careers/dev-storage?${q}`
  },
  readStream(key) {
    return createReadStream(localPath(key))
  },
  writeStream(key) {
    const p = localPath(key)
    mkdirSync(path.dirname(p), { recursive: true })
    return createWriteStream(p)
  },
}

export async function localWrite(key: string, data: Uint8Array) {
  const p = localPath(key)
  await mkdir(path.dirname(p), { recursive: true })
  const fh = await open(p, 'w')
  try {
    await fh.write(data)
  } finally {
    await fh.close()
  }
}

export function getStorage(): CareersStorage {
  assertStorageConfigured()
  return careersConfig.storageDriver === 'local' ? local : gcs
}

export const pendingKey = (id: string, now = new Date()) =>
  `pending/${now.toISOString().slice(0, 7)}/${id}.pdf`

export const applicationKey = (roleSlug: string, submissionId: string) =>
  `applications/${roleSlug}/${submissionId}.pdf`

export const PENDING_KEY_RE = /^pending\/\d{4}-\d{2}\/[0-9a-f-]{36}\.pdf$/
