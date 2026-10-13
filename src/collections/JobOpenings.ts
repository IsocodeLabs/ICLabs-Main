import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { adminOnly, publicRead } from '@/access'
import { revalidateCareers } from '@/lib/careers/revalidate'

/**
 * Roles Isocode is hiring for — CMS-managed so roles open, pause and close
 * without a redeploy. `status` is the single switch (v2 hiring cycle):
 *
 *   open      card shown · form accepts · detail page normal
 *   paused    card shown with a badge · form refuses · detail says "paused"
 *   closed    card hidden · form refuses · detail says "closed"
 *   archived  card hidden · form refuses · detail 404s
 *
 * Every change revalidates the careers pages (afterChange), and the pages also
 * carry a 60 s ISR window as the backstop — Cloud Run instances each hold their
 * own ISR cache, so the hook only refreshes the instance that served the admin
 * request. The submit API reads status from the DB, so a paused role stops
 * accepting applications within seconds regardless of page caching.
 *
 * `roleKey` stays the stable id applications point at (pre-v2 rows use
 * `swe-intern`, `design-intern`, `sales-exec`, `open`). `slug` is the public URL.
 * `active` / `stipend` / `description` are pre-v2 fields kept so no old data is
 * lost; `active` is now derived from `status`.
 */
export const JobOpenings: CollectionConfig = {
  slug: 'job-openings',
  admin: {
    useAsTitle: 'title',
    group: 'Careers',
    defaultColumns: ['title', 'status', 'roleKind', 'applicationCap', 'order'],
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.status) data.active = data.status === 'open' || data.status === 'paused'
        return data
      },
    ],
    afterChange: [
      ({ doc, previousDoc }) => {
        revalidateCareers([doc?.slug, previousDoc?.slug])
        return doc
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'open',
          index: true,
          options: [
            { label: 'Open', value: 'open' },
            { label: 'Paused', value: 'paused' },
            { label: 'Closed', value: 'closed' },
            { label: 'Archived', value: 'archived' },
          ],
          admin: {
            description: 'Takes effect on the live site within 60 seconds. No deploy needed.',
          },
        },
        {
          name: 'applicationCap',
          type: 'number',
          min: 1,
          admin: {
            description: 'Optional. When this many applications arrive this cycle, the role auto-pauses.',
          },
        },
        { name: 'order', type: 'number', defaultValue: 0 },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'slug',
          type: 'text',
          unique: true,
          admin: { description: 'Public URL: careers.isocodelabs.com/roles/<slug>' },
        },
        {
          name: 'roleKey',
          type: 'text',
          required: true,
          unique: true,
          admin: { description: 'Stable id applications are filed under. Don’t change once live.' },
        },
        {
          name: 'roleKind',
          type: 'select',
          required: true,
          defaultValue: 'sde',
          options: [
            { label: 'Growth', value: 'growth' },
            { label: 'Product (PM)', value: 'pm' },
            { label: 'Engineering (SDE)', value: 'sde' },
            { label: 'Open application', value: 'open' },
          ],
          admin: { description: 'Decides which extra fields the application form asks for.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
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
        { name: 'dept', label: 'Department', type: 'text' },
        { name: 'location', type: 'text', defaultValue: 'Remote' },
        { name: 'duration', type: 'text', admin: { description: 'e.g. "6 months"' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'payLine',
          type: 'text',
          admin: { description: 'Pay text on the role card.' },
        },
        {
          name: 'baseSalaryMonthlyINR',
          type: 'number',
          admin: {
            description:
              'For Google job search (JSON-LD). Leave empty when pay is performance-linked.',
          },
        },
      ],
    },
    {
      name: 'eyebrow',
      type: 'text',
      admin: { description: 'e.g. "Growth · Remote · 6 months" — card meta row and job page eyebrow.' },
    },
    {
      name: 'stipendShort',
      label: 'Stipend (key facts strip)',
      type: 'text',
      admin: {
        description: 'Short pay text for the job page header strip. Falls back to Pay line.',
      },
    },
    {
      name: 'blurb',
      label: 'One-liner',
      type: 'textarea',
      admin: { description: 'One line on the role card.' },
    },
    {
      name: 'about',
      label: 'The role (summary)',
      type: 'textarea',
      admin: { description: '“The role” paragraph on the job page.' },
    },
    {
      name: 'responsibilities',
      label: 'What you’ll do',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'lookingFor',
      label: 'What you bring (requirements)',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'niceToHave',
      label: 'Nice to have',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'startNote',
      label: 'Start',
      type: 'text',
      admin: { description: 'Role details “Start” row, e.g. "Confirmed at the offer stage".' },
    },
    {
      name: 'hiringProcess',
      type: 'array',
      admin: { description: 'The steps shown in the hiring-process stepper, in order.' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'datePosted', type: 'date' },
        {
          name: 'validThrough',
          type: 'date',
          admin: { description: 'Optional application deadline (JSON-LD only).' },
        },
        {
          name: 'applicantLocation',
          type: 'text',
          defaultValue: 'IN',
          admin: { description: 'Country code applicants must be in (JSON-LD).' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'SEO and sharing',
      admin: { initCollapsed: true },
      fields: [
        { name: 'seoTitle', type: 'text', admin: { description: 'Full page title (no suffix added).' } },
        { name: 'seoDescription', type: 'textarea' },
        { name: 'ogTitle', type: 'text' },
        { name: 'ogDescription', type: 'textarea' },
      ],
    },
    {
      name: 'copyVersion',
      type: 'number',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Seeded copy version. The migration only rewrites copy older than the current seed.',
      },
    },
    // ── no longer shown on the site (kept so no data is lost) ──
    {
      name: 'stack',
      label: 'What you’ll work with',
      type: 'array',
      admin: { description: 'Not shown since the v3 job pages.' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'compensation',
      type: 'textarea',
      admin: { description: 'Not shown since the v3 job pages (internal terms stay off the site).' },
    },
    {
      name: 'footnote',
      type: 'text',
      admin: { description: 'Not shown since the v3 job pages. Use Start.' },
    },
    // ── pre-v2 fields, kept so no data is lost ──
    {
      name: 'stipend',
      type: 'text',
      admin: { description: 'Legacy (pre-v2). Not shown on the site; use Pay line.' },
    },
    {
      name: 'description',
      type: 'richText',
      editor: lexicalEditor(),
      admin: { description: 'Legacy (pre-v2). Not shown on the site.' },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { readOnly: true, description: 'Legacy. Derived from Status.' },
    },
    {
      name: 'openApplication',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true, description: 'Legacy. Use Role kind = Open application.' },
    },
  ],
}
