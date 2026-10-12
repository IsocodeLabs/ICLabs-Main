/**
 * Creates / configures the private CV bucket. Idempotent — safe to re-run.
 *
 *   CAREERS_GCS_BUCKET=isocode-careers-cvs \
 *   CAREERS_ALLOWED_ORIGINS=https://careers.isocodelabs.com \
 *   npx tsx scripts/careers-gcs-setup.ts
 *
 * Uses Application Default Credentials (`gcloud auth application-default login`).
 *
 * Sets:
 * - location asia-south1 (Mumbai) — CVs stay in India (DPDP)
 * - uniform bucket-level access + public access prevention ENFORCED
 * - object versioning ON (Google-managed encryption at rest is always on)
 * - CORS: browsers may POST uploads and GET signed URLs from the careers origins
 * - lifecycle: pending/ (abandoned uploads) deleted after 2 days, exports/ (ZIPs)
 *   after 1 day, and their noncurrent versions after 3 days.
 *   NOTHING under applications/ ever auto-expires.
 */
import { Storage } from '@google-cloud/storage'

const name = process.env.CAREERS_GCS_BUCKET
if (!name) {
  console.error('Set CAREERS_GCS_BUCKET')
  process.exit(1)
}
const origins = (process.env.CAREERS_ALLOWED_ORIGINS || 'https://careers.isocodelabs.com,https://isocodelabs.com')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

async function run() {
  const storage = new Storage()
  const bucket = storage.bucket(name!)
  const [exists] = await bucket.exists()
  if (!exists) {
    console.log(`creating gs://${name} in asia-south1`)
    await storage.createBucket(name!, {
      location: 'ASIA-SOUTH1',
      storageClass: 'STANDARD',
      iamConfiguration: {
        uniformBucketLevelAccess: { enabled: true },
        publicAccessPrevention: 'enforced',
      },
      versioning: { enabled: true },
    })
  } else {
    const [meta] = await bucket.getMetadata()
    if (meta.location !== 'ASIA-SOUTH1') console.warn(`! bucket is in ${meta.location}, not ASIA-SOUTH1`)
  }

  await bucket.setMetadata({
    iamConfiguration: {
      uniformBucketLevelAccess: { enabled: true },
      publicAccessPrevention: 'enforced',
    },
    versioning: { enabled: true },
    cors: [
      {
        origin: origins,
        method: ['POST', 'GET', 'HEAD'],
        responseHeader: ['Content-Type', 'Content-Disposition'],
        maxAgeSeconds: 3600,
      },
    ],
    lifecycle: {
      rule: [
        { action: { type: 'Delete' }, condition: { age: 2, matchesPrefix: ['pending/'] } },
        { action: { type: 'Delete' }, condition: { age: 1, matchesPrefix: ['exports/'] } },
        {
          action: { type: 'Delete' },
          condition: { isLive: false, daysSinceNoncurrentTime: 3, matchesPrefix: ['pending/', 'exports/'] },
        },
      ],
    },
  })

  const [meta] = await bucket.getMetadata()
  console.log(
    JSON.stringify(
      {
        bucket: meta.name,
        location: meta.location,
        publicAccessPrevention: meta.iamConfiguration?.publicAccessPrevention,
        uniformBucketLevelAccess: meta.iamConfiguration?.uniformBucketLevelAccess?.enabled,
        versioning: meta.versioning?.enabled,
        cors: meta.cors,
        lifecycle: meta.lifecycle,
      },
      null,
      2,
    ),
  )
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
