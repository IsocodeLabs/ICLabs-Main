import type { CollectionConfig } from 'payload'
import { adminOnly, noOne } from '@/access'

/**
 * Private résumé store — PDF uploads attached to job applications.
 *
 * Unlike Media (public, image-only, webp-converted), résumés are personal data:
 * admin-read only, never public, PDF only, no image processing. The public site
 * never creates these directly — the submitApplication server action uploads
 * with overrideAccess after validating the file.
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
