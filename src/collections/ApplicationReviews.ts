import type { CollectionConfig } from 'payload'
import { adminOnly, noOne } from '@/access'
import { DECISIONS } from '@/lib/careers/review'

/**
 * One founder's review of one applicant. Each reviewer has at most one review
 * per applicant (the unique index on application + reviewer), so two founders
 * reviewing the same person write separate rows and never overwrite each other.
 * The merged result is kept on the application as `reviewState` /
 * `reviewDecision` (see lib/careers/reviews.ts).
 *
 * Written only through the screening API (POST …/applications/[id]/review).
 */
export const ApplicationReviews: CollectionConfig = {
  slug: 'application-reviews',
  admin: {
    group: 'Careers',
    useAsTitle: 'decision',
    defaultColumns: ['application', 'reviewer', 'decision', 'rating', 'updatedAt'],
    description: 'Each founder’s own review of an applicant. Merged on the applicant’s row.',
  },
  access: {
    read: adminOnly,
    create: noOne,
    update: noOne,
    delete: noOne,
  },
  indexes: [{ fields: ['application', 'reviewer'], unique: true }],
  fields: [
    { name: 'application', type: 'relationship', relationTo: 'applications', required: true, index: true },
    { name: 'reviewer', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'decision',
      type: 'select',
      required: true,
      options: DECISIONS.map((d) => ({ label: d.label, value: d.value })),
    },
    { name: 'rating', type: 'number', min: 1, max: 5 },
    { name: 'note', type: 'textarea', maxLength: 2000 },
  ],
  timestamps: true,
}
