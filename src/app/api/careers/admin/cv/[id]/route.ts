import { requireAdmin, safeFilePart } from '@/lib/careers/admin'
import { logError } from '@/lib/careers/log'
import { json } from '@/lib/careers/request'
import { getStorage } from '@/lib/careers/storage'

export const dynamic = 'force-dynamic'

/** A short-lived (10 min) signed URL to view one applicant's CV inline. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error
  const { payload } = auth
  const id = Number((await params).id)
  try {
    const app = await payload.findByID({
      collection: 'applications',
      id,
      depth: 1,
      overrideAccess: true,
      select: { name: true, objectKey: true, resume: true },
    })
    if (app?.objectKey) {
      const url = await getStorage().signedReadUrl(app.objectKey, {
        expiresInSeconds: 600,
        filename: `${safeFilePart(app.name ?? '')}-cv.pdf`,
      })
      return json({ ok: true, url })
    }
    // pre-v2 application: the legacy Payload upload (admin-authenticated route)
    if (app?.resume && typeof app.resume === 'object' && app.resume.url) {
      return json({ ok: true, url: app.resume.url, legacy: true })
    }
    return json({ ok: false, error: 'No CV on file.' }, 404)
  } catch (err) {
    logError('admin_cv_url_failed', err, { applicationId: id })
    return json({ ok: false, error: 'Couldn’t open the CV.' }, 500)
  }
}
