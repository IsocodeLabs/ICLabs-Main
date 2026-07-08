import type { CollectionConfig } from 'payload'
import { adminOnly, noOne } from '@/access'

/**
 * Ops — quiz + contact submissions. Admin-only via API; the site creates
 * these server-side (Local API in server actions, validated), never publicly.
 */
export const LeadSubmissions: CollectionConfig = {
  slug: 'lead-submissions',
  admin: {
    useAsTitle: 'id',
    group: 'Ops',
    defaultColumns: ['kind', 'status', 'dealBreakerFlag', 'createdAt'],
  },
  access: {
    read: adminOnly,
    create: noOne, // site endpoints use overrideAccess server-side
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Short quiz', value: 'shortQuiz' },
        { label: 'Long quiz', value: 'longQuiz' },
        { label: 'Contact', value: 'contact' },
      ],
    },
    {
      name: 'answers',
      type: 'json',
      admin: { description: '[{ questionId, prompt, optionLabel, optionValue, signalKey, signalValue }]' },
    },
    {
      name: 'contact',
      type: 'json',
      admin: { description: '{ name, email, company, note } as captured.' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Prospect', value: 'prospect' },
        { label: 'Client', value: 'client' },
        { label: 'Declined', value: 'declined' },
      ],
    },
    { name: 'dealBreakerFlag', type: 'checkbox', defaultValue: false },
    {
      name: 'derived',
      type: 'json',
      admin: { description: '{ companySize, context, aspiration } pulled from signals.' },
    },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal only.' } },
  ],
  timestamps: true,
}
