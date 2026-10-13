/**
 * Careers v2 migration — idempotent, never deletes anything.
 *
 *   npm run careers:migrate -- --dry-run     # report only
 *   npm run careers:migrate                  # apply (local DB)
 *   npm run careers:migrate -- --yes         # apply against a non-local DB
 *
 * 1. Booting Payload in non-production mode pushes the schema (adds the new v2
 *    columns/tables). Drizzle prompts before anything destructive — answer "no"
 *    if it lists a careers table/column, and stop.
 * 2. Roles: upserts the 3 roles + the open application from seed-data.ts by
 *    roleKey. Missing roles are created. Existing roles get the seeded copy only
 *    when their `copyVersion` is older than CAREERS_COPY_VERSION (so a copy
 *    update like PRD v3 lands once, and later edits in the CMS are kept) or when
 *    --refresh-content is passed. Copy updates never touch status,
 *    applicationCap or roleKey — founders control those live.
 * 3. Archives Sales Executive, Design Intern and any v1 "Business Development &
 *    Product Manager Intern" role (status → archived; rows stay).
 * 4. Applications: fills the new `cycle` ('legacy') and `stage` columns on pre-v2
 *    rows from their old `status`. The old `status` value is left untouched.
 *
 * Take a DB backup first when running against production (see the runbook).
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  applicationForm,
  archivedRoleKeys,
  archivedV1RoleKeys,
  CAREERS_COPY_VERSION,
  careerRoles,
} from '../src/lib/seed-data'

const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry-run')
const REFRESH = args.has('--refresh-content')

const dbUri = process.env.DATABASE_URI || ''
const isLocal = /@(127\.0\.0\.1|localhost)[:/]/.test(dbUri)
if (!isLocal && !DRY && !args.has('--yes')) {
  console.error('Refusing to write to a non-local database without --yes. Back it up first.')
  process.exit(1)
}

const STAGE_FROM_STATUS = `CASE status::text
  WHEN 'new' THEN 'applied'
  WHEN 'shortlist' THEN 'shortlisted'
  WHEN 'interview' THEN 'in_process'
  WHEN 'offer' THEN 'offer'
  WHEN 'rejected' THEN 'rejected'
  ELSE 'applied' END`

async function run() {
  const payload = await getPayload({ config })
  const log = (...m: unknown[]) => console.log(DRY ? '[dry-run]' : '[migrate]', ...m)

  // ── roles ──
  for (const seed of careerRoles) {
    const existing = await payload.find({
      collection: 'job-openings',
      where: { roleKey: { equals: seed.roleKey } },
      limit: 1,
      depth: 0,
    })
    // copy only: never status / applicationCap / roleKey on an existing role
    const copy = {
      title: seed.title,
      slug: seed.slug,
      order: seed.order,
      roleKind: seed.roleKind,
      type: seed.type,
      dept: seed.dept,
      location: seed.location,
      duration: seed.duration,
      payLine: seed.payLine,
      stipendShort: seed.stipendShort,
      baseSalaryMonthlyINR: seed.baseSalaryMonthlyINR,
      eyebrow: seed.eyebrow,
      blurb: seed.blurb,
      about: seed.about,
      responsibilities: seed.responsibilities.map((text) => ({ text })),
      lookingFor: seed.lookingFor.map((text) => ({ text })),
      niceToHave: seed.niceToHave.map((text) => ({ text })),
      startNote: seed.startNote,
      hiringProcess: seed.hiringProcess,
      seoTitle: seed.seoTitle,
      seoDescription: seed.seoDescription,
      ogTitle: seed.ogTitle,
      ogDescription: seed.ogDescription,
      datePosted: seed.datePosted,
      validThrough: seed.validThrough,
      applicantLocation: 'IN',
      openApplication: seed.roleKind === 'open',
      // v2 copy no longer shown: cleared so internal terms aren't served by the public API
      stack: [],
      compensation: '',
      footnote: '',
      copyVersion: CAREERS_COPY_VERSION,
    }
    const doc = existing.docs[0]
    if (!doc) {
      log(`create role ${seed.roleKey}`)
      if (!DRY) {
        await payload.create({
          collection: 'job-openings',
          data: { ...copy, roleKey: seed.roleKey, status: seed.status, applicationCap: seed.applicationCap },
        })
      }
    } else if ((doc.copyVersion ?? 0) < CAREERS_COPY_VERSION || REFRESH) {
      log(`update role ${seed.roleKey} (id ${doc.id}) copy v${doc.copyVersion ?? 2} → v${CAREERS_COPY_VERSION}`)
      if (!DRY) await payload.update({ collection: 'job-openings', id: doc.id, data: copy })
    } else {
      log(`keep role ${seed.roleKey} (copy v${doc.copyVersion} is current)`)
    }
  }

  // ── application form global: intro is the v3 privacy line ──
  const form = await payload.findGlobal({ slug: 'application-form', depth: 0 })
  if (form?.intro !== applicationForm.intro) {
    log(`update application-form intro`)
    if (!DRY) await payload.updateGlobal({ slug: 'application-form', data: { intro: applicationForm.intro } })
  }

  // ── archive old roles ──
  const toArchive = await payload.find({
    collection: 'job-openings',
    where: {
      or: [
        { roleKey: { in: [...archivedRoleKeys, ...archivedV1RoleKeys] } },
        { slug: { in: archivedV1RoleKeys } },
        { title: { like: 'Business Development' } },
      ],
    },
    limit: 50,
    depth: 0,
  })
  for (const r of toArchive.docs) {
    if (r.status === 'archived') continue
    log(`archive role ${r.roleKey} “${r.title}”`)
    if (!DRY) {
      await payload.update({
        collection: 'job-openings',
        id: r.id,
        data: { status: 'archived', slug: r.slug ?? r.roleKey },
      })
    }
  }

  const leftovers = await payload.find({
    collection: 'job-openings',
    where: { slug: { exists: false } },
    limit: 50,
    depth: 0,
  })
  const handled = new Set([...careerRoles.map((r) => r.roleKey), ...toArchive.docs.map((r) => r.roleKey)])
  for (const r of leftovers.docs) {
    if (handled.has(r.roleKey)) continue
    log(`NOTE: role ${r.roleKey} “${r.title}” has no slug and isn't in the v2 list — left as is (hidden from the site).`)
  }

  // ── applications backfill (raw SQL: one statement, no hooks, no stage-history noise) ──
  const pool = (payload.db as unknown as { pool: import('pg').Pool }).pool
  const pending = await pool.query(
    `SELECT status::text AS status, count(*)::int AS n FROM applications WHERE cycle IS NULL GROUP BY 1 ORDER BY 1`,
  )
  const total = pending.rows.reduce((s, r) => s + r.n, 0)
  log(`applications without a cycle: ${total}`, pending.rows)
  if (!DRY && total > 0) {
    const res = await pool.query(
      `UPDATE applications
          SET cycle = 'legacy',
              stage = (${STAGE_FROM_STATUS})::enum_applications_stage
        WHERE cycle IS NULL`,
    )
    log(`backfilled ${res.rowCount} applications (cycle=legacy, stage from status)`)
  }

  const counts = await pool.query(
    `SELECT count(*)::int AS applications FROM applications`,
  )
  log('applications in DB:', counts.rows[0].applications)
  log('done')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
