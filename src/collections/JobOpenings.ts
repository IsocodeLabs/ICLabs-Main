import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { adminOnly, publicRead } from '@/access'

/**
 * Roles Isocode is hiring for — CMS-managed so openings open and close without a
 * redeploy. Seed-fallback carries the current three roles + the evergreen open
 * application in seed-data.ts. Publicly readable; only admins mutate.
 */
export const JobOpenings: CollectionConfig = {
  slug: 'job-openings',
  admin: {
    useAsTitle: 'title',
    group: 'Careers',
    defaultColumns: ['title', 'type', 'dept', 'active', 'order'],
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'roleKey',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Stable slug the application form targets, e.g. "swe-intern".' },
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'intern',
      options: [
        { label: 'Internship', value: 'intern' },
        { label: 'Full-time', value: 'fullTime' },
        { label: 'Contract', value: 'contract' },
      ],
    },
    { name: 'dept', type: 'text', admin: { description: 'e.g. Engineering, Design, Sales.' } },
    { name: 'location', type: 'text', defaultValue: 'Remote' },
    { name: 'stipend', type: 'text', admin: { description: 'e.g. "₹50k / month stipend".' } },
    { name: 'blurb', type: 'textarea', admin: { description: 'One or two lines shown on the role card.' } },
    { name: 'description', type: 'richText', editor: lexicalEditor() },
    { name: 'active', type: 'checkbox', defaultValue: true },
    {
      name: 'openApplication',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'The evergreen "exceptional / open application" entry.' },
    },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
