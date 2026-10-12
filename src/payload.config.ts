import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'

import { Users } from '@/collections/Users'
import { Media } from '@/collections/Media'
import { Products } from '@/collections/Products'
import { Stats } from '@/collections/Stats'
import { Values } from '@/collections/Values'
import { ValueQuotes } from '@/collections/ValueQuotes'
import { Quizzes, QuizStages, QuizQuestions } from '@/collections/Quizzes'
import { LeadSubmissions } from '@/collections/LeadSubmissions'
import { Pages } from '@/collections/Pages'
import { Founders } from '@/collections/Founders'
import { JobOpenings } from '@/collections/JobOpenings'
import { Applications } from '@/collections/Applications'
import { Resumes } from '@/collections/Resumes'
import { CareersAuditLog } from '@/collections/CareersAuditLog'
import { SiteSettings } from '@/globals/SiteSettings'
import { Homepage } from '@/globals/Homepage'
import { ApplicationForm } from '@/globals/ApplicationForm'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' — ISOCODELABS Admin',
    },
    components: {
      // careers screening desk (hiring cycle v2)
      views: {
        screening: {
          Component: '/components/admin/screening/ScreeningView#ScreeningView',
          path: '/screening',
        },
      },
      beforeNavLinks: ['/components/admin/screening/ScreeningNavLink#ScreeningNavLink'],
      beforeDashboard: ['/components/admin/screening/CareersDashboard#CareersDashboard'],
    },
  },
  collections: [
    Users,
    Media,
    Products,
    Stats,
    Values,
    ValueQuotes,
    Quizzes,
    QuizStages,
    QuizQuestions,
    LeadSubmissions,
    Pages,
    Founders,
    JobOpenings,
    Applications,
    Resumes,
    CareersAuditLog,
  ],
  globals: [SiteSettings, Homepage, ApplicationForm],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // One pool per Cloud Run instance (Payload caches the instance across
    // requests). Keep DB_POOL_MAX × Cloud Run max instances under Cloud SQL's
    // max_connections — see docs/careers-runbook.md.
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      max: Number(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    },
  }),
  sharp,
})
