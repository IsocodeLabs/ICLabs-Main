# Deploy: careers hiring cycle v2

**Branch:** `feat/careers-hiring-cycle-v2`
**Goes live on:** careers.isocodelabs.com (same Cloud Run service, DB and admin as isocodelabs.com)
**Handover:** Aryan (dev) → Dex (deployment)

This file is the go-live checklist. Do the steps in order and tick them off. [`docs/careers-runbook.md`](docs/careers-runbook.md) explains how the pipeline works and how to run it day to day. [`.env.example`](.env.example) lists every env var.

> **🔴 Production Payload is down (found 13 Oct 2026, 05:05 IST, before careers v2 was deployed).** Every Payload route on isocodelabs.com returns `500 {"message":"There was an error initializing Payload"}`: `/api/*`, `/api/users/me`, and `/admin/login` errors too. Public pages still render only because they fall back to the built-in seed copy and are ISR-cached. **The old careers form, the contact form and the quiz can't save anything while this lasts.** This has to be fixed before any step below. Likely causes, in order:
> 1. The Cloud SQL instance is stopped or unreachable (check `gcloud sql instances describe $SQL_INSTANCE --format='value(state,settings.activationPolicy)'`; it should be `RUNNABLE` / `ALWAYS`).
> 2. The service lost its Cloud SQL connection or `DATABASE_URI` (`gcloud run services describe $SERVICE --region $REGION`; check `run.googleapis.com/cloudsql-instances` and the env/secret).
> 3. The real error is in the logs: `gcloud run services logs read $SERVICE --region $REGION --limit 200 | grep -i -A5 "payload\|error"`.

> **⚠️ Already merged to `main` (13 Oct 2026, at Aryan's call). Pushing to `main` auto-deploys (confirmed: live about 4.5 min after the push).** Production is running this code **before** its setup, and `/api/careers/health` reports `db:false, storage:false, turnstile:false`. Until then:
> - the careers application form fails: uploads return 500 until the GCS bucket and env vars exist, and submits fail until the migration has run;
> - Payload admin's Applications and Job Openings screens error until the migration adds the new columns;
> - the careers pages themselves still render (they fall back to the seeded v2 roles).
>
> **Do these first, in this order, as soon as possible:** step 1 (values), 2 (Turnstile), 3 (buckets + IAM), 4 (secrets, env, build args), then 7.1–7.4 (backup, sizing, **prod migration**, deploy with env). Rehearsing on staging (step 5) is still recommended before the migration if there's time. The load test (step 6) and smoke test (step 8) still gate announcing. Step 10's "open the PR" no longer applies.

> **Rule from the PRD:** don't share the careers link publicly (LinkedIn, WhatsApp groups) until step 6, the load test, has passed **and** the production smoke test in step 8 is green.

---

## Image caching: one Cloudflare setting

The site's art is served from content-hashed URLs under `/_next/static/media/` with `Cache-Control: public, max-age=31536000, immutable`. Browsers keep these files for a year and never re-request them. Optimized photos and logos (`/_next/image?...`) are cached for 30 days, and plain `/public` files for 7 days.

Cloudflare only edge-caches URLs it treats as static, and `/_next/image?...` has no file extension. Today it shows `cf-cache-status: DYNAMIC`, so every Cloud Run instance re-encodes those images. Add one **Cache Rule** in the Cloudflare dashboard (Caching → Cache Rules) for isocodelabs.com:

- **When:** URI Path starts with `/_next/image` **or** URI Path starts with `/_next/static/`
- **Then:** Eligible for cache. Edge TTL: use the cache-control header from the origin. Browser TTL: respect origin.

Check it afterwards: `curl -sI "https://isocodelabs.com/_next/static/media/<any art file>"` should show `cf-cache-status: HIT` on the second request.

---

## 0. Where things stand

**Done and verified locally (dev server + local Postgres):**
- Data model, migration script (idempotent; tested on a copy of the pre-v2 data shape), the 3 roles plus the open application, and the archiving of old roles.
- Careers page, role pages, Open Application section, hiring-process stepper, JSON-LD, sitemap and applicant privacy notice.
- The application form. Tests covered direct CV upload, duplicate submits (no extra rows), the one-per-email+role+cycle block, PDF and size checks, the honeypot, rate limits, paused/closed/archived roles, and Turnstile with Cloudflare's test keys.
- A burst of 300 concurrent applications plus 30 duplicate resends: 0 lost, 0 duplicate rows.
- The admin screening desk at `/admin/screening`, tested against 10k fake rows: filters, keyboard screening, bulk stage change, CSV, ZIP, role controls, and audited deletion.
- `npm run build` passes.

**Only provable on GCP (this deploy):**
- **Real GCS:** signed POST uploads, CORS, copy, signed read URLs and the ZIP export. Locally a disk-backed stand-in with the same contract was used.
- **Turnstile with the real production keys.**
- **The production DB migration.**
- **The load test (PRD §8):** 1,000 applications in 5 minutes, 200 in flight.

---

## 1. Access and values you need

| Thing | How to find it | Value |
|---|---|---|
| GCP project ID | `gcloud projects list` | `PROJECT_ID=________` |
| Cloud Run region + service | `gcloud run services list` | `REGION=________` `SERVICE=________` |
| Cloud SQL instance | `gcloud sql instances list` | `SQL_INSTANCE=________` |
| Cloud Run runtime service account | `gcloud run services describe $SERVICE --region $REGION --format='value(spec.template.spec.serviceAccountName)'` (empty = default compute SA `<project-number>-compute@developer.gserviceaccount.com`) | `SA=________` |
| Cloud SQL `max_connections` | Cloud SQL → instance → Flags, or `SHOW max_connections;` | `________` |
| How the live site is built and deployed today | Cloud Build trigger, or a manual `docker build`? | `________` |

Access you need: GCP Owner or Editor on the project, the Cloudflare dashboard for isocodelabs.com, the Resend dashboard, and push access to `IsocodeLabs/ICLabs-Main`.

Generate three secrets now and keep them in a password manager:

```bash
openssl rand -base64 48   # CAREERS_SIGNING_SECRET
openssl rand -base64 48   # CAREERS_CRON_SECRET
openssl rand -base64 48   # staging PAYLOAD_SECRET (staging only)
```

---

> **Human check is OFF (14 Oct 2026, Aryan's call).** The "Verify you are human" step was blocking real applicants, so CV uploads no longer require it. Rate limits, the PDF checks, the honeypot and one application per email + role still apply. **If spam applications show up,** set `CAREERS_HUMAN_CHECK=on` on the Cloud Run service (`gcloud run services update $SERVICE --region $REGION --update-env-vars CAREERS_HUMAN_CHECK=on`). That needs no code change, and the forms pick it up within about 60 s. The Turnstile keys below can stay configured either way.

## 2. Cloudflare Turnstile (5 min)

1. Cloudflare dashboard → **Turnstile** → **Add widget**.
   - Name: `isocode-careers`
   - Hostnames: `careers.isocodelabs.com`, `isocodelabs.com`. Add the staging hostname too if staging gets its own domain. Otherwise use the always-pass test keys on staging (step 5).
   - Widget mode: **Managed**.
2. Note the **site key** (public) and the **secret key**.

- [ ] Turnstile site key: `________`
- [ ] Turnstile secret stored in Secret Manager (step 4)

---

## 3. CV buckets (GCS, Mumbai) and permissions

```bash
gcloud config set project $PROJECT_ID
gcloud auth application-default login

# production bucket
CAREERS_GCS_BUCKET=isocode-careers-cvs \
CAREERS_ALLOWED_ORIGINS=https://careers.isocodelabs.com,https://isocodelabs.com \
npx tsx scripts/careers-gcs-setup.ts

# staging / load-test bucket. Add the staging origin you'll use.
CAREERS_GCS_BUCKET=isocode-careers-cvs-staging \
CAREERS_ALLOWED_ORIGINS=https://<staging-host> \
npx tsx scripts/careers-gcs-setup.ts
```

The script prints the final bucket config. Check that it shows `location: ASIA-SOUTH1`, `publicAccessPrevention: enforced`, `versioning: true`, the CORS origins, and lifecycle rules for `pending/` (2 days) and `exports/` (1 day) only.

Grant the runtime service account access to the buckets, plus permission to sign URLs as itself (no key files):

```bash
for B in isocode-careers-cvs isocode-careers-cvs-staging; do
  gcloud storage buckets add-iam-policy-binding gs://$B \
    --member="serviceAccount:$SA" --role="roles/storage.objectAdmin"
done
gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --member="serviceAccount:$SA" --role="roles/iam.serviceAccountTokenCreator"
gcloud services enable iamcredentials.googleapis.com
```

If staging runs under a different service account, grant it the same roles on the staging bucket only.

- [ ] Both buckets created and verified
- [ ] IAM bindings done

---

## 4. Secrets and env vars

Put secrets in Secret Manager and let the runtime SA read them:

```bash
printf '%s' '<turnstile secret>'       | gcloud secrets create TURNSTILE_SECRET_KEY --data-file=-
printf '%s' '<CAREERS_SIGNING_SECRET>' | gcloud secrets create CAREERS_SIGNING_SECRET --data-file=-
printf '%s' '<CAREERS_CRON_SECRET>'    | gcloud secrets create CAREERS_CRON_SECRET --data-file=-
for S in TURNSTILE_SECRET_KEY CAREERS_SIGNING_SECRET CAREERS_CRON_SECRET; do
  gcloud secrets add-iam-policy-binding $S --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
done
```

**Runtime env (production Cloud Run service):**

| Var | Production value |
|---|---|
| `CAREERS_STORAGE` | `gcs` |
| `CAREERS_GCS_BUCKET` | `isocode-careers-cvs` |
| `CAREERS_CYCLE` | `2026-10` |
| `NEXT_PUBLIC_CAREERS_URL` | `https://careers.isocodelabs.com` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile site key |
| `TURNSTILE_SECRET_KEY` | secret → `TURNSTILE_SECRET_KEY:latest` |
| `CAREERS_SIGNING_SECRET` | secret → `CAREERS_SIGNING_SECRET:latest` |
| `CAREERS_CRON_SECRET` | secret → `CAREERS_CRON_SECRET:latest` |
| `DB_POOL_MAX` | `10` (see step 7 sizing) |
| `CAREERS_RL_UPLOAD` / `CAREERS_RL_SUBMIT` | leave unset (defaults 40 / 20 per IP per 10 min) |
| `CAREERS_RL_DISABLED` | **must be unset or `false` in production** |
| existing: `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | unchanged |

**Build args (important).** `NEXT_PUBLIC_*` values are compiled into the browser bundle, so the image build must receive them. The Dockerfile now declares them:

```bash
docker build \
  --build-arg DATABASE_URI="$DATABASE_URI" \
  --build-arg PAYLOAD_SECRET="$PAYLOAD_SECRET" \
  --build-arg NEXT_PUBLIC_SERVER_URL=https://isocodelabs.com \
  --build-arg NEXT_PUBLIC_CAREERS_URL=https://careers.isocodelabs.com \
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key> \
  -t $REGION-docker.pkg.dev/$PROJECT_ID/<repo>/isocodelabs:careers-v2 .
```

If a Cloud Build trigger builds the image, add the two new `--build-arg`s (or substitutions) to its config instead. If you forget them, the site still works, but links fall back to `/careers/...` and Turnstile is never rendered, so **every upload is refused in production.** That makes it easy to catch in the smoke test.

- [ ] Secrets created and readable by the SA
- [ ] Build config has the 2 new build args

---

## 5. Staging (for the migration rehearsal and the load test)

Build staging from a **clone of production** so the migration gets rehearsed on real data before it touches prod:

```bash
# 1) clone prod DB → staging instance (a full copy; delete it afterwards)
gcloud sql instances clone $SQL_INSTANCE isocode-sql-staging

# 2) staging Cloud Run service from this branch's image
gcloud run deploy isocodelabs-staging \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/<repo>/isocodelabs:careers-v2 \
  --region $REGION --service-account $SA \
  --min-instances 1 --max-instances 4 --concurrency 80 --cpu 1 --memory 1Gi --timeout 600 \
  --add-cloudsql-instances $PROJECT_ID:$REGION:isocode-sql-staging \
  --set-env-vars "^##^CAREERS_STORAGE=gcs##CAREERS_GCS_BUCKET=isocode-careers-cvs-staging##CAREERS_CYCLE=loadtest-$(date +%Y%m%d)##CAREERS_RL_DISABLED=true##TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA##DB_POOL_MAX=10##NEXT_PUBLIC_SERVER_URL=https://<staging-host>##PAYLOAD_SECRET=<staging secret>##DATABASE_URI=postgres://<user>:<pass>@/<db>?host=/cloudsql/$PROJECT_ID:$REGION:isocode-sql-staging"
```

(`^##^` switches gcloud's list separator from `,` to `##`, so values containing commas or `?` survive. The `DATABASE_URI` uses the Cloud SQL unix socket that `--add-cloudsql-instances` mounts. Copy the user, password and db name from prod's `DATABASE_URI`, since the clone has the same users.)

- Staging uses Cloudflare's **always-pass test secret** and **rate limits off**, because all load-test traffic comes from one machine.
- For staging, build the image with `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA` (the test site key) and `NEXT_PUBLIC_CAREERS_URL` left empty. Or reuse the prod image and just test the APIs, which is all the load test does.
- Add the staging origin to the staging bucket's CORS (step 3) if you'll click through the form in a browser there.

**Rehearse the migration on the clone:**

```bash
DATABASE_URI="<staging connection string>" npm run careers:migrate -- --dry-run
DATABASE_URI="<staging connection string>" npm run careers:migrate -- --yes
```

What to expect (connect through the Cloud SQL Auth Proxy from your laptop):
- Drizzle prints a schema diff. **Careers v2 only adds columns and tables.**
- It will **also ask to drop `homepage.creator_mention_body` and `homepage.creator_mention_href`**. That comes from Dex's "remove creator studio" commit (`12e1065`), not from careers. Answer `y` on staging. On prod, save those values first if anyone wants them.
- If it asks to drop or rename anything **careers-related** (`applications`, `job_openings`, `resumes`), answer **N** and stop. That shouldn't happen.
- Then: `create role business-growth-intern`, `create role product-manager-intern`, `update role swe-intern…`, `update role open…`, `archive role sales-exec`, `archive role design-intern`, and `backfilled N applications`. A second run should print only "keep role …" lines and `applications without a cycle: 0`.
- Check: `SELECT cycle, stage, status, count(*) FROM applications GROUP BY 1,2,3;`. Every pre-v2 row keeps its old `status` and now has `cycle='legacy'`.

- [ ] Staging service up; `GET https://<staging-host>/api/careers/health` returns `{"ok":true,…}`
- [ ] Migration rehearsed on the clone (dry run, then real, then a second run is a no-op)
- [ ] One manual application through the staging form in a browser: CV uploads, success screen, row visible in `/admin/screening`, CV opens inline

---

## 6. Load test (PRD §8, the gate before going public)

```bash
brew install k6
k6 run -e BASE_URL=https://<staging-host> loadtest/careers-burst.js
```

Pass criteria:
- [ ] k6 thresholds green: `http_req_failed < 0.5%`, `apply_duration p95 < 1500ms`, `apply_fail = 0`, `upload_fail = 0`
- [ ] **0 lost:** `SELECT count(*) FROM applications WHERE cycle = 'loadtest-<date>';` equals k6's `apply_ok`
- [ ] Every row's CV exists: `gcloud storage ls "gs://isocode-careers-cvs-staging/applications/**" | wc -l` ≥ that count
- [ ] No ERROR entries in Cloud Logging for the staging service (`jsonPayload.component="careers"`)
- [ ] Share a short results summary with Aryan (k6 summary + the two counts)

If p95 is too high, check in this order: Cloud SQL CPU (raise the tier for launch week), `DB_POOL_MAX` against `max_connections`, Cloud Run instance count, and cold starts (min instances).

Then clean up:

```bash
gcloud run services delete isocodelabs-staging --region $REGION
gcloud sql instances delete isocode-sql-staging        # it's a clone with real applicant data; don't leave it lying around
gcloud storage rm -r "gs://isocode-careers-cvs-staging/**"  # keep the empty bucket for next time, or delete it
```

---

## 7. Production deploy

1. **Back up the DB:** `gcloud sql backups create --instance=$SQL_INSTANCE`. Make sure **automated daily backups + point-in-time recovery** are on (PRD §8).
2. **Size the connections.** Cloud Run `max-instances × DB_POOL_MAX` must be at most `max_connections − 10`. For launch: min instances **1**, max instances **4**, concurrency **80**, timeout **600 s** (the ZIP export needs it), `DB_POOL_MAX=10`. If the current Cloud SQL tier is shared-core (`db-f1-micro` / `db-g1-small`), bump it to at least `db-custom-1-3840` for launch week and scale back down after.
3. **Migrate prod:** dry run, then real, exactly as rehearsed in step 5, against `$SQL_INSTANCE`.
4. **Deploy** the image built from this branch with the build args from step 4, using the existing deploy flow, then set the runtime env:
   ```bash
   gcloud run services update $SERVICE --region $REGION \
     --min-instances 1 --max-instances 4 --concurrency 80 --timeout 600 \
     --update-env-vars "CAREERS_STORAGE=gcs,CAREERS_GCS_BUCKET=isocode-careers-cvs,CAREERS_CYCLE=2026-10,NEXT_PUBLIC_CAREERS_URL=https://careers.isocodelabs.com,NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key>,DB_POOL_MAX=10" \
     --update-secrets "TURNSTILE_SECRET_KEY=TURNSTILE_SECRET_KEY:latest,CAREERS_SIGNING_SECRET=CAREERS_SIGNING_SECRET:latest,CAREERS_CRON_SECRET=CAREERS_CRON_SECRET:latest"
   ```
5. **Cloudflare:** no DNS change is needed (careers.isocodelabs.com is already proxied to this service). Optional but recommended: put **Cloudflare Access** (free for up to 50 users) in front of `isocodelabs.com/admin*` and `careers.isocodelabs.com/admin*`, limited to the founders' emails. That's the 2FA layer the PRD asks for, since Payload has none built in.

**Rollback** is safe: all schema changes are additive. Run `gcloud run services update-traffic $SERVICE --region $REGION --to-revisions <previous-revision>=100`. The old code still runs against the migrated DB.

- [ ] Backup taken; PITR on
- [ ] Prod migrated
- [ ] New revision serving 100%

---

## 8. Production smoke test (about 15 min, before announcing)

Use a real browser on careers.isocodelabs.com, preferably one desktop and one phone.

- [ ] `/` shows 3 role cards in order (Business Growth, Product Management, Software Engineering), the Open Application section below them, and no Sales Executive or Design Intern
- [ ] The Business Growth card reads **"₹1 lakh/month + commission"**, and its role page shows the full line **"₹1,00,000/month at target + 20% commission beyond"** (cards are short on purpose: title, pay, one fact row)
- [ ] Each `/roles/<slug>` page loads with About, What you'll do, What we look for, Compensation and the hiring stepper; `/roles/sales-exec` returns 404
- [ ] Submit one real test application per kind (growth, pm, sde, open) with a real PDF. You get the success message, and a second try with the same email + role gets the "You've already applied…" message
- [ ] Those rows appear in `/admin/screening`, the CV renders inline, and rating, shortlist, tag and notes save
- [ ] Pause the PM role in the screening desk. Within 60 s its card shows "Applications paused" and its page says "Applications are paused". Reopen it.
- [ ] Download a CSV and a ZIP for the test rows; the ZIP link works
- [ ] Delete the test applications with **Delete applicant data** (type the email). Check the rows are gone, the Careers Audit Log has entries, and `gcloud storage ls gs://isocode-careers-cvs/applications/**` no longer lists them
- [ ] `https://careers.isocodelabs.com/api/careers/health` returns `ok: true`
- [ ] Paste each role URL into the [Rich Results Test](https://search.google.com/test/rich-results). JobPosting is valid, and Business Growth has **no** baseSalary
- [ ] Lighthouse (mobile) on `/` and one `/roles/<slug>`: Perf ≥ 90, A11y ≥ 95, SEO ≥ 95 (PRD §8). If anything is under, log it; don't block on it.
- [ ] Try a CV over 5 MB and a `.png` renamed to `.pdf`. Both are refused with a clear message

---

## 9. Daily digest + monitoring

**Founders' daily digest** (09:00 IST):

```bash
gcloud services enable cloudscheduler.googleapis.com
gcloud scheduler jobs create http careers-digest \
  --location=$REGION --schedule="0 9 * * *" --time-zone="Asia/Kolkata" \
  --uri="https://isocodelabs.com/api/careers/cron/digest" --http-method=POST \
  --headers="Authorization=Bearer <CAREERS_CRON_SECRET>"
gcloud scheduler jobs run careers-digest --location=$REGION   # sends one now; check the inbox
```

The digest goes through Resend. Make sure `isocodelabs.com` is a **verified sending domain** in Resend, or the email won't deliver.

**Monitoring:**

- [ ] **Uptime check:** Cloud Monitoring → Uptime checks → HTTPS GET `careers.isocodelabs.com/api/careers/health` every 5 min, alerting both founders.
- [ ] **Error alert:** Logging → Log-based metrics → counter `careers_apply_failed` with filter `jsonPayload.component="careers" AND jsonPayload.event="apply_failed"`. Then add an alert policy on it: more than 5 in 5 min (≈ 2% at burst volume), notifying the founders.
- [ ] **Error Reporting:** open it once, confirm careers errors group there, and turn on email notifications.

---

## 10. Go live

- [ ] Steps 1–9 ticked
- [ ] Open the PR `feat/careers-hiring-cycle-v2` → `main`, link the load-test summary, merge (main = what's deployed)
- [ ] Tell Aryan. **Now** the careers link can go out on LinkedIn and WhatsApp.

**Launch-day watch:** keep the screening desk and Cloud Run metrics (instance count, latency, 5xx) open for the first hour after the announcement.

---

## Notes and known limits

- **Applicant confirmation emails are off on purpose.** Resend's free plan allows 100 emails a day, which can't cover a 1,000-application burst. Applicants see the success message, and founders get the daily digest.
- **The rate limit trusts Cloudflare's `cf-connecting-ip`.** Someone who finds the raw `*.run.app` URL can bypass the per-IP limit. They can't bypass Turnstile, which is the main gate. To close the gap fully, restrict Cloud Run ingress to a load balancer that only Cloudflare reaches. That costs money and isn't required.
- **GCS soft delete** keeps deleted objects for 7 days. After an applicant's deletion request, their CV becomes unrecoverable once that window passes.
- **`npm run lint` is broken on main** (Next 16 removed `next lint`, and ESLint isn't installed). This predates this branch.
- **New hiring cycle later:** change `CAREERS_CYCLE` (e.g. `2027-04`) and redeploy. People can then apply again.
- **Approximate cost** on top of today: GCS for CVs is a few cents a month, logging is within the free tier, and one always-on min instance is roughly $5–15 a month. The staging clone and a bigger Cloud SQL tier for launch week are temporary. Delete or scale them back afterwards.
