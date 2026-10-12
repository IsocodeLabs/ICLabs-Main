import type { CollectionConfig } from 'payload'
import { adminOnly, noOne } from '@/access'

/**
 * Append-only audit trail for sensitive careers actions — today, applicant data
 * deletions (DPDP requests) and bulk stage changes. Entries carry no PII: the
 * applicant is referenced by id and a salted email hash, never by name/email.
 * Nobody can edit or delete entries through the API or admin.
 */
export const CareersAuditLog: CollectionConfig = {
  slug: 'careers-audit-log',
  admin: {
    group: 'Careers',
    useAsTitle: 'action',
    defaultColumns: ['action', 'applicationId', 'actor', 'createdAt'],
    description: 'Read-only record of deletions and bulk actions.',
  },
  access: {
    read: adminOnly,
    create: noOne,
    update: noOne,
    delete: noOne,
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Applicant data deleted', value: 'applicant_deleted' },
        { label: 'Bulk stage change', value: 'bulk_stage' },
        { label: 'CSV export', value: 'csv_export' },
        { label: 'CV ZIP export', value: 'zip_export' },
      ],
    },
    { name: 'applicationId', type: 'text', index: true },
    { name: 'emailHash', type: 'text', admin: { description: 'Salted SHA-256 of the email.' } },
    { name: 'actor', type: 'relationship', relationTo: 'users' },
    { name: 'detail', type: 'json' },
  ],
  timestamps: true,
}
