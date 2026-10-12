import type { CollectionConfig } from 'payload'
import { adminOnly, noOne } from '@/access'

/**
 * LEGACY (pre-v2) private résumé store — PDF uploads attached to job
 * applications before the hiring-cycle v2 pipeline. New CVs go straight to the
 * private GCS bucket (see src/lib/careers/storage.ts); this collection is kept
 * so old applications keep their résumé link. No new rows are created.
 *
 * Unlike Media (public, image-only, webp-converted), résumés are personal data:
 * admin-read only, never public, PDF only, no image processing. The public site
 * never created these directly — the old submitApplication server action
 * uploaded with overrideAccess after validating the file.
 */
export const Resumes: CollectionConfig = {
  slug: 'resumes',
  admin: {
    group: 'Careers',
    useAsTitle: 'filename',
    description: 'Applicant résumés (PDF). Private — never exposed publicly.',
  },
  access: {
    read: adminOnly,
    create: noOne,
    update: adminOnly,
    delete: adminOnly,
  },
  upload: {
    staticDir: 'resumes',
    mimeTypes: ['application/pdf'],
  },
  fields: [
    {
      name: 'applicantName',
      type: 'text',
      admin: { description: 'Captured for admin context; the file itself is the résumé.' },
    },
  ],
}
