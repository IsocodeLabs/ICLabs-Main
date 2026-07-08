import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from '@/access'

/** The Problem section stats band — industry stats, testimonial-styled. */
export const Stats: CollectionConfig = {
  slug: 'stats',
  admin: {
    useAsTitle: 'value',
    group: 'Content',
    defaultColumns: ['value', 'label', 'source', 'order'],
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'value', type: 'text', required: true, admin: { description: 'e.g. "50 ms", "94%"' } },
    { name: 'label', type: 'text', required: true, admin: { description: 'One line.' } },
    { name: 'source', type: 'text', required: true, admin: { description: 'Popular name — Google / Forbes / Stanford.' } },
    { name: 'sourceNote', type: 'text', admin: { description: 'Fuller citation (footnote only).' } },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
