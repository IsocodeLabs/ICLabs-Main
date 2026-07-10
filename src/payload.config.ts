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
  ],
  globals: [SiteSettings, Homepage, ApplicationForm],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
})
