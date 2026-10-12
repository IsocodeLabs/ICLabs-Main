import { randomUUID } from 'node:crypto'
import { Zip, ZipPassThrough } from 'fflate'
import { buildWhere, filtersFrom, requireAdmin, safeFilePart, sortFor } from '@/lib/careers/admin'
import { logError, logInfo } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'
import { getStorage } from '@/lib/careers/storage'

export const dynamic = 'force-dynamic'
export const maxDuration = 600

const MAX_FILES = 500

/**
 * Bulk CV download: a ZIP of the CVs matching the current filter (or the
 * selected rows), capped at 500 files. It's built bucket-to-bucket inside this
 * request — CVs stream from GCS through the zipper back into
 * exports/{uuid}.zip — and the founder gets a signed link valid for 1 hour.
 * (Cloud Run throttles CPU outside requests, so a detached background job would
 * be less reliable than doing it here; the UI shows a progress state.)
 * exports/ is lifecycle-deleted after a day.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload, user } = auth
  const body = (await req.json().catch(() => ({}))) as { ids?: number[]; filters?: Record<string, string> }
  const filters = filtersFrom(body.filters ?? {})
  const ids = (body.ids ?? []).filter((n) => Number.isInteger(n))
  const where = ids.length ? { and: [{ id: { in: ids } }, { objectKey: { exists: true } }] } : { and: [buildWhere(filters), { objectKey: { exists: true } }] }

  try {
    const res = await payload.find({
      collection: 'applications',
      where,
      sort: sortFor(filters),
      limit: MAX_FILES + 1,
      depth: 0,
      overrideAccess: true,
      select: { name: true, role: true, objectKey: true },
    })
    if (res.docs.length === 0) return json({ ok: false, error: 'No CVs match this filter.' }, 404)
    if (res.totalDocs > MAX_FILES) {
      return json(
        { ok: false, error: `That’s ${res.totalDocs} CVs — narrow the filter to ${MAX_FILES} or fewer.` },
        400,
      )
    }

    const storage = getStorage()
    const key = `exports/${randomUUID()}.zip`
    const out = storage.writeStream(key, 'application/zip')
    const finished = new Promise<void>((resolve, reject) => {
      out.on('finish', () => resolve())
      out.on('close', () => resolve())
      out.on('error', reject)
    })

    const zip = new Zip((err, chunk, final) => {
      if (err) return out.destroy(err)
      out.write(chunk)
      if (final) out.end()
    })

    const used = new Set<string>()
    let added = 0
    for (const app of res.docs) {
      if (!app.objectKey) continue
      let name = `${safeFilePart(app.role ?? 'role')}/${safeFilePart(app.name ?? '')}-${app.id}.pdf`
      while (used.has(name)) name = name.replace(/\.pdf$/, '-1.pdf')
      used.add(name)
      const entry = new ZipPassThrough(name) // PDFs are already compressed — store as-is
      zip.add(entry)
      for await (const chunk of storage.readStream(app.objectKey) as AsyncIterable<Uint8Array>) {
        entry.push(chunk)
      }
      entry.push(new Uint8Array(0), true)
      added++
    }
    zip.end()
    await finished

    const url = await storage.signedReadUrl(key, {
      expiresInSeconds: 3600,
      filename: `isocode-cvs-${new Date().toISOString().slice(0, 10)}.zip`,
      inline: false,
    })
    await payload.create({
      collection: 'careers-audit-log',
      overrideAccess: true,
      data: { action: 'zip_export', actor: user.id, detail: { count: added, filters, ids: ids.slice(0, 500) } },
    })
    logInfo('admin_zip_ok', { count: added })
    return json({ ok: true, url, count: added })
  } catch (err) {
    logError('admin_zip_failed', err)
    return json({ ok: false, error: 'Couldn’t build the ZIP — try a smaller filter.' }, 500)
  }
}
