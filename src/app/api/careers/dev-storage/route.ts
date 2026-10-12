import { careersConfig } from '@/lib/careers/config'
import { devVerify, getStorage, localWrite } from '@/lib/careers/storage'

export const dynamic = 'force-dynamic'

/**
 * DEV ONLY stand-in for the GCS bucket (CAREERS_STORAGE=local): accepts the
 * signed multipart POST the browser would send to GCS, and serves signed reads.
 * 404s in production or whenever the GCS driver is in use.
 */
const enabled = () => careersConfig.storageDriver === 'local' && !careersConfig.isProd

export async function POST(req: Request) {
  if (!enabled()) return new Response('Not found', { status: 404 })
  const form = await req.formData()
  const key = String(form.get('key') || '')
  const exp = Number(form.get('exp'))
  const max = Number(form.get('max'))
  const contentType = String(form.get('Content-Type') || '')
  const sig = String(form.get('sig') || '')
  const file = form.get('file')
  if (!devVerify('put', key, exp, sig, `${max}:${contentType}`)) return new Response('Forbidden', { status: 403 })
  if (!(file instanceof Blob)) return new Response('Missing file', { status: 400 })
  // mirror GCS policy enforcement: size range + exact content type
  if (file.size < 1 || file.size > max) return new Response('EntityTooLarge', { status: 400 })
  if (file.type !== contentType) return new Response('Content-Type mismatch', { status: 403 })
  await localWrite(key, new Uint8Array(await file.arrayBuffer()))
  return new Response(null, { status: 201 })
}

export async function GET(req: Request) {
  if (!enabled()) return new Response('Not found', { status: 404 })
  const u = new URL(req.url)
  const key = u.searchParams.get('key') || ''
  const exp = Number(u.searchParams.get('exp'))
  const sig = u.searchParams.get('sig') || ''
  if (!devVerify('get', key, exp, sig)) return new Response('Forbidden', { status: 403 })
  const storage = getStorage()
  const meta = await storage.stat(key)
  if (!meta) return new Response('Not found', { status: 404 })
  const filename = (u.searchParams.get('filename') || key.split('/').pop() || 'file').replace(/"/g, '')
  const disposition = u.searchParams.get('disposition') === 'attachment' ? 'attachment' : 'inline'
  const stream = storage.readStream(key) as unknown as AsyncIterable<Uint8Array>
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) controller.enqueue(chunk)
        controller.close()
      },
    }),
    {
      headers: {
        'content-type': key.endsWith('.zip') ? 'application/zip' : 'application/pdf',
        'content-disposition': `${disposition}; filename="${filename}"`,
        'cache-control': 'private, no-store',
      },
    },
  )
}
