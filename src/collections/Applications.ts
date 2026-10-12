import type { CollectionConfig } from 'payload'
import { adminOnly, noOne } from '@/access'

export const APPLICATION_STAGES = [
  { label: 'Applied', value: 'applied' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'In process', value: 'in_process' },
  { label: 'Offer', value: 'offer' },
  { label: 'Hired', value: 'hired' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Withdrawn', value: 'withdrawn' },
] as const

export type ApplicationStage = (typeof APPLICATION_STAGES)[number]['value']

/**
 * Job applications — Round 1 submissions + the screening state founders work on.
 *
 * Writes come only from POST /api/careers/apply (validated, idempotent on
 * `submissionId`, one per email + role + cycle via `dedupeKey`). The résumé
 * lives in the private GCS bucket at `objectKey`; admins view it through
 * short-lived signed URLs. Screening happens in the custom Screening view
 * (/admin/screening); this collection's own list view still works for one-offs.
 *
 * Nobody hard-deletes from here — the only permitted delete is the audited
 * "Delete applicant data" action for an applicant's deletion request.
 *
 * Pre-v2 rows keep their original values: `status` (old ladder), the Payload
 * `resume` upload, `year`, `answers`, `duplicateEmail`. The v2 migration only
 * fills the new `stage` / `cycle` columns alongside them.
 */
export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    useAsTitle: 'name',
    group: 'Careers',
    defaultColumns: ['name', 'roleTitle', 'college', 'gradYear', 'rating', 'stage', 'createdAt'],
    listSearchableFields: ['name', 'email', 'college'],
    pagination: { defaultLimit: 50 },
    description: 'For fast screening use the Screening view (left nav → Screening).',
  },
  access: {
    read: adminOnly,
    create: noOne,
    update: adminOnly,
    delete: noOne,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation, req }) => {
        // record who moved the stage and when
        if (operation === 'update' && data?.stage && data.stage !== originalDoc?.stage) {
          const at = new Date().toISOString()
          const by = req.user?.id ?? null
          data.stageChangedAt = at
          data.stageChangedBy = by
          data.stageHistory = [
            ...(originalDoc?.stageHistory ?? []).map((h: { stage: string; at: string; by?: unknown }) => ({
              stage: h.stage,
              at: h.at,
              by: typeof h.by === 'object' && h.by ? (h.by as { id: unknown }).id : h.by,
            })),
            { stage: data.stage, at, by },
          ]
        }
        return data
      },
    ],
  },
  indexes: [{ fields: ['role', 'cycle', 'stage'] }],
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true, index: true },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'role',
          type: 'text',
          index: true,
          admin: { description: 'roleKey of the role applied for.' },
        },
        { name: 'roleTitle', type: 'text', admin: { description: 'Title captured at submit time.' } },
        {
          name: 'cycle',
          type: 'text',
          index: true,
          admin: { description: 'Hiring cycle, e.g. 2026-10. Pre-v2 rows are "legacy".' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'stage',
          type: 'select',
          defaultValue: 'applied',
          required: true,
          index: true,
          options: [...APPLICATION_STAGES],
        },
        { name: 'rating', type: 'number', min: 1, max: 5, index: true },
        { name: 'tags', type: 'text', hasMany: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'college', type: 'text', index: true },
        { name: 'gradYear', label: 'Graduation year', type: 'number', index: true },
        { name: 'startDate', label: 'Earliest start date', type: 'date' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'linkedinUrl', label: 'LinkedIn', type: 'text' },
        { name: 'githubUrl', label: 'GitHub', type: 'text' },
        {
          name: 'portfolioUrl',
          label: 'Portfolio / sample work',
          type: 'text',
        },
        { name: 'projectUrl', label: 'Best shipped project', type: 'text' },
      ],
    },
    {
      name: 'pitchNote',
      label: 'Something they’ve sold, pitched or launched',
      type: 'textarea',
    },
    {
      name: 'why',
      label: 'What they’d do at Isocode (open application)',
      type: 'textarea',
    },
    {
      name: 'interestArea',
      type: 'select',
      options: [
        { label: 'Engineering', value: 'engineering' },
        { label: 'Product', value: 'product' },
        { label: 'Design', value: 'design' },
        { label: 'Growth', value: 'growth' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'commitSixMonths', label: 'Can commit 6 months, remote', type: 'checkbox' },
        { name: 'consentAt', label: 'Privacy consent given at', type: 'date' },
      ],
    },
    { name: 'notes', label: 'Internal notes', type: 'textarea' },
    // ── résumé ──
    {
      type: 'row',
      fields: [
        {
          name: 'objectKey',
          type: 'text',
          admin: { readOnly: true, description: 'Private bucket path of the CV.' },
        },
        { name: 'resumeSize', type: 'number', admin: { readOnly: true } },
      ],
    },
    // ── idempotency + dedupe (null on pre-v2 rows, so the unique indexes allow them) ──
    {
      type: 'row',
      fields: [
        { name: 'submissionId', type: 'text', unique: true, admin: { readOnly: true } },
        {
          name: 'dedupeKey',
          type: 'text',
          unique: true,
          admin: { readOnly: true, description: 'cycle:role:email — one application each.' },
        },
      ],
    },
    // ── stage audit ──
    {
      type: 'row',
      fields: [
        { name: 'stageChangedAt', type: 'date', admin: { readOnly: true } },
        {
          name: 'stageChangedBy',
          type: 'relationship',
          relationTo: 'users',
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'stageHistory',
      type: 'array',
      admin: { readOnly: true, initCollapsed: true },
      fields: [
        { name: 'stage', type: 'text' },
        { name: 'at', type: 'date' },
        { name: 'by', type: 'relationship', relationTo: 'users' },
      ],
    },
    // ── pre-v2 fields, kept so no data is lost ──
    {
      name: 'resume',
      type: 'upload',
      relationTo: 'resumes',
      admin: {
        description: 'Legacy (pre-v2) résumé upload.',
        components: { Cell: '/components/admin/ResumeCell#default' },
      },
    },
    {
      name: 'status',
      type: 'select',
      index: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'Shortlist', value: 'shortlist' },
        { label: 'Interview', value: 'interview' },
        { label: 'Offer', value: 'offer' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: { readOnly: true, description: 'Legacy (pre-v2) status. Use Stage.' },
    },
    { name: 'year', type: 'text', admin: { readOnly: true, description: 'Legacy (pre-v2).' } },
    {
      name: 'duplicateEmail',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true, description: 'Legacy (pre-v2) duplicate flag.' },
    },
    {
      name: 'answers',
      type: 'json',
      admin: { readOnly: true, description: 'Legacy (pre-v2) raw form answers.' },
    },
  ],
  timestamps: true,
}
