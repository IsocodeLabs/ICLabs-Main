import type { CollectionConfig } from 'payload'
import { adminOnly, noOne } from '@/access'

/**
 * Job applications — submissions store. Admin-read only; the public site never
 * creates these directly. The submitApplication server action validates and
 * writes with overrideAccess, attaching the résumé from the Resumes collection.
 *
 * The status ladder (new → shortlist → interview → offer → rejected) is the
 * spine of the v3.5 admin triage.
 */
export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    useAsTitle: 'name',
    group: 'Careers',
    defaultColumns: ['name', 'roleTitle', 'status', 'createdAt'],
  },
  access: {
    read: adminOnly,
    create: noOne,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'role',
      type: 'text',
      admin: { description: 'roleKey applied for, or "open" for the open application.' },
    },
    { name: 'roleTitle', type: 'text', admin: { description: 'Human title captured at submit time.' } },
    { name: 'college', type: 'text' },
    { name: 'year', type: 'text' },
    { name: 'portfolioUrl', type: 'text' },
    { name: 'resume', type: 'upload', relationTo: 'resumes' },
    { name: 'why', type: 'textarea' },
    {
      name: 'answers',
      type: 'json',
      admin: { description: 'Raw captured field map (key → value), for CMS-added fields.' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Shortlist', value: 'shortlist' },
        { label: 'Interview', value: 'interview' },
        { label: 'Offer', value: 'offer' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal only.' } },
  ],
  timestamps: true,
}
