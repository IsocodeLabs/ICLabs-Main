/**
 * LOCAL QA ONLY — seeds N fake applicants (default 10,000) so the screening
 * desk can be tested at real volume (QA checklist: filters, search, sort and
 * pagination with 10k records). Refuses to run against anything but a local DB.
 *
 *   npx tsx --env-file=.env scripts/careers-seed-fake.ts [count]
 *
 * All rows share one tiny fixture CV and use @example.test emails; they are
 * filed under cycle "qa-fake" so they never mix with real cycles. Remove with:
 *   npx tsx --env-file=.env scripts/careers-seed-fake.ts --remove
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { localWrite } from '../src/lib/careers/storage'

const dbUri = process.env.DATABASE_URI || ''
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(dbUri)) {
  console.error('Refusing: careers-seed-fake only runs against a local database.')
  process.exit(1)
}

const FIXTURE_KEY = 'applications/_qa/fixture.pdf'
const FIXTURE_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 60>>stream
BT /F1 24 Tf 72 700 Td (QA fixture CV - not a real person) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF
`

async function run() {
  const payload = await getPayload({ config })
  const pool = (payload.db as unknown as { pool: import('pg').Pool }).pool

  if (process.argv.includes('--remove')) {
    const r = await pool.query(`DELETE FROM applications WHERE cycle = 'qa-fake'`)
    console.log(`removed ${r.rowCount} fake applicants`)
    return
  }

  const count = Number(process.argv[2]) || 10_000
  if (process.env.CAREERS_STORAGE !== 'gcs') await localWrite(FIXTURE_KEY, new TextEncoder().encode(FIXTURE_PDF))

  const res = await pool.query(
    `INSERT INTO applications (
       name, email, phone, role, role_title, cycle, stage, rating, college, grad_year, start_date,
       commit_six_months, consent_at, linkedin_url, github_url, object_key, resume_size,
       submission_id, dedupe_key, created_at, updated_at)
     SELECT
       'QA Applicant ' || g,
       'qa' || g || '@example.test',
       '+9190000' || lpad(g::text, 5, '0'),
       (ARRAY['business-growth-intern','product-manager-intern','swe-intern','open'])[1 + g % 4],
       (ARRAY['Business Growth Intern','Product Manager Intern','Software Engineering Intern','Open application'])[1 + g % 4],
       'qa-fake',
       (ARRAY['applied','applied','applied','applied','shortlisted','rejected','in_process'])[1 + g % 7]::enum_applications_stage,
       CASE WHEN g % 3 = 0 THEN 1 + g % 5 ELSE NULL END,
       (ARRAY['IIT Delhi','IIT Bombay','BITS Pilani','NIT Trichy','DTU','IIIT Hyderabad','VIT Vellore','Manipal'])[1 + g % 8],
       2025 + g % 4,
       now() + (g % 60) * interval '1 day',
       true,
       now() - (g % 20) * interval '1 day',
       'https://www.linkedin.com/in/qa-' || g,
       CASE WHEN g % 4 = 2 THEN 'https://github.com/qa-' || g END,
       $1,
       700,
       gen_random_uuid()::text,
       'qa-fake:' || g,
       now() - (g % 20) * interval '1 day' - (g % 1440) * interval '1 minute',
       now()
     FROM generate_series(1, $2::int) AS g`,
    [FIXTURE_KEY, count],
  )
  console.log(`seeded ${res.rowCount} fake applicants (cycle qa-fake)`)
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
