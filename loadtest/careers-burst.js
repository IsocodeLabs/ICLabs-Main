/**
 * k6 burst test for the Round 1 pipeline (PRD §8):
 *   1,000 complete applications (upload-url → direct upload → apply) within
 *   5 minutes, up to 200 in flight. Pass: 0 lost submissions, error rate < 0.5%,
 *   apply p95 < 1.5 s server time.
 *
 * Run against STAGING only (separate bucket + DB), with on staging:
 *   TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA   (always-pass test secret)
 *   CAREERS_RL_DISABLED=true    (all traffic comes from this one machine)
 *   CAREERS_CYCLE=loadtest-<date>
 *
 *   k6 run -e BASE_URL=https://staging-careers.example.run.app loadtest/careers-burst.js
 *
 * Then confirm "0 lost": the `apply_ok` count below must equal
 *   SELECT count(*) FROM applications WHERE cycle = 'loadtest-<date>';
 * and every row's object must exist under applications/ in the staging bucket.
 */
import http from 'k6/http'
import { check, fail } from 'k6'
import { Counter, Trend } from 'k6/metrics'
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js'

const BASE = __ENV.BASE_URL || 'http://localhost:3000'
const TOTAL = Number(__ENV.TOTAL || 1000)
const ROLES = ['business-growth-intern', 'product-manager-intern', 'swe-intern']

// ~300 KB synthetic PDF (typical CV size); valid header + padding
const PDF = '%PDF-1.4\n' + '%'.padEnd(300 * 1024, 'x') + '\n%%EOF\n'

const applyOk = new Counter('apply_ok')
const applyFail = new Counter('apply_fail')
const uploadFail = new Counter('upload_fail')
const applyDuration = new Trend('apply_duration', true)
const endToEnd = new Trend('end_to_end', true)

export const options = {
  scenarios: {
    burst: {
      executor: 'shared-iterations',
      vus: 200, // up to 200 applications in flight
      iterations: TOTAL,
      maxDuration: '5m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.005'],
    apply_duration: ['p(95)<1500'],
    apply_fail: ['count==0'],
    upload_fail: ['count==0'],
  },
}

function fieldsFor(role, n) {
  const f = {
    name: `Load Test ${n}`,
    email: `load-${n}-${uuidv4().slice(0, 8)}@example.test`,
    phone: `+9190${String(10000000 + n).slice(-8)}`,
    college: 'Load Test University',
    gradYear: '2027',
    startDate: '2026-12-01',
    commitSixMonths: true,
    consent: true,
  }
  if (role === 'swe-intern') f.githubUrl = 'https://github.com/load-test'
  else f.linkedinUrl = 'https://www.linkedin.com/in/load-test'
  return f
}

export default function () {
  const started = Date.now()
  const n = __ITER + __VU * 100000
  const role = ROLES[n % ROLES.length]
  const json = { headers: { 'content-type': 'application/json' } }

  // 1) upload slot
  const slotRes = http.post(
    `${BASE}/api/careers/upload-url`,
    JSON.stringify({ role, fileSize: PDF.length, contentType: 'application/pdf', turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX' }),
    { ...json, tags: { step: 'upload-url' } },
  )
  if (!check(slotRes, { 'upload-url 200': (r) => r.status === 200 })) {
    uploadFail.add(1)
    return
  }
  const slot = slotRes.json()

  // 2) direct upload to the bucket (multipart POST policy)
  const form = Object.assign({}, slot.upload.fields, {
    file: http.file(PDF, 'cv.pdf', 'application/pdf'),
  })
  const up = http.post(slot.upload.url.startsWith('http') ? slot.upload.url : `${BASE}${slot.upload.url}`, form, {
    tags: { step: 'bucket' },
  })
  if (!check(up, { 'bucket upload 2xx': (r) => r.status >= 200 && r.status < 300 })) {
    uploadFail.add(1)
    return
  }

  // 3) submit (retry once with the same submissionId — must stay idempotent)
  const submissionId = uuidv4()
  const body = JSON.stringify({ submissionId, role, objectKey: slot.objectKey, ticket: slot.ticket, fields: fieldsFor(role, n) })
  let res = http.post(`${BASE}/api/careers/apply`, body, { ...json, tags: { step: 'apply' } })
  if (res.status >= 500 || res.status === 0) res = http.post(`${BASE}/api/careers/apply`, body, { ...json, tags: { step: 'apply-retry' } })
  applyDuration.add(res.timings.duration)
  if (check(res, { 'apply ok': (r) => r.status === 200 && r.json('ok') === true })) {
    applyOk.add(1)
    endToEnd.add(Date.now() - started)
  } else {
    applyFail.add(1)
    if (__ENV.FAIL_FAST) fail(`apply failed ${res.status} ${res.body}`)
  }
}
