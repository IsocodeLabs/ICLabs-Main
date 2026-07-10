import type { GlobalConfig } from 'payload'
import { adminOnly, publicRead } from '@/access'

/**
 * The shared application form definition — CMS-authored so fields can be added
 * or removed without a redeploy (mirrors the Quizzes config pattern). The role
 * dropdown is not defined here; it is derived live from JobOpenings.
 *
 * Seed-fallback in seed-data.ts carries the default field set (college, year,
 * portfolio URL, résumé, "why Isocode"). The résumé field (type: file) is
 * handled specially by the submit action — PDF only, size-capped.
 */
export const ApplicationForm: GlobalConfig = {
  slug: 'application-form',
  admin: { group: 'Careers' },
  access: {
    read: publicRead,
    update: adminOnly,
  },
  fields: [
    { name: 'intro', type: 'textarea', admin: { description: 'Short line above the form.' } },
    {
      name: 'fields',
      type: 'array',
      admin: { description: 'Ordered fields rendered after name/email/role (always present).' },
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          defaultValue: 'text',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'URL', value: 'url' },
            { label: 'Long text', value: 'textarea' },
            { label: 'Select', value: 'select' },
            { label: 'File (PDF)', value: 'file' },
          ],
        },
        { name: 'placeholder', type: 'text' },
        { name: 'required', type: 'checkbox', defaultValue: true },
        {
          name: 'options',
          type: 'array',
          admin: { description: 'For select fields only.' },
          fields: [
            { name: 'label', type: 'text' },
            { name: 'value', type: 'text' },
          ],
        },
      ],
    },
  ],
}
