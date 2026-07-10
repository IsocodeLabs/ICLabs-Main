import type { CollectionConfig } from 'payload'
import { adminOnly, noOne } from '@/access'

/**
 * Job applications — submissions store + the v3.5 triage surface. Admin-read
 * only; the public site never creates these directly. The submitApplication
 * server action validates and writes with overrideAccess, attaching the résumé
 * from the Resumes collection.
 *
 * The status ladder (new → shortlist → interview → offer → rejected) is the
 * spine of triage. The list view is built for volume (1000+): role/name/college/
 * status columns, filter by role + status, search by name/email/college, a
 * one-click "Open PDF" résumé cell, and an auto duplicate-email flag.
 */
export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    useAsTitle: 'name',
    group: 'Careers',
    defaultColumns: ['roleTitle', 'name', 'college', 'status', 'duplicateEmail', 'resume', 'createdAt'],
    listSearchableFields: ['name', 'email', 'college', 'roleTitle'],
    pagination: { defaultLimit: 50 },
  },
  access: {
    read: adminOnly,
    create: noOne,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // dedupe signal: flag the moment a repeat email applies
        if (operation === 'create' && data?.email) {
          const prior = await req.payload.find({
            collection: 'applications',
            where: { email: { equals: data.email } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })
          data.duplicateEmail = prior.totalDocs > 0
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true, index: true },
    {
      name: 'role',
      type: 'text',
      admin: { description: 'roleKey applied for, or "open" for the open application.' },
    },
    { name: 'roleTitle', type: 'text', admin: { description: 'Human title captured at submit time.' } },
    { name: 'college', type: 'text' },
    { name: 'year', type: 'text' },
    { name: 'portfolioUrl', type: 'text' },
    {
      name: 'resume',
      type: 'upload',
      relationTo: 'resumes',
      admin: { components: { Cell: '/components/admin/ResumeCell#default' } },
    },
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
      required: true,
      index: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'Shortlist', value: 'shortlist' },
        { label: 'Interview', value: 'interview' },
        { label: 'Offer', value: 'offer' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'duplicateEmail',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
        description: 'Auto-flagged when this email had already applied before.',
      },
    },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal only.' } },
  ],
  timestamps: true,
}
