import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from '@/access'

/** Labs catalog — the proof section. Most dynamic collection. */
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'status', 'showOnSite', 'order'],
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'blurb', type: 'text', required: true, admin: { description: 'The one-liner.' } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'live',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'Live · funded', value: 'funded' },
        { label: 'Live · paying clients', value: 'paying' },
        { label: 'Deep-tech · live', value: 'deeptech' },
        { label: 'In development', value: 'in-dev' },
        { label: 'Parked', value: 'parked' },
        { label: 'Hidden', value: 'hidden' },
      ],
    },
    { name: 'badge', type: 'text', defaultValue: 'from ISOCODELABS' },
    { name: 'outboundURL', type: 'text', admin: { description: 'The product’s own site.' } },
    { name: 'previewImage', type: 'upload', relationTo: 'media' },
    { name: 'order', type: 'number', defaultValue: 0 },
    {
      name: 'showOnSite',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Uncheck to keep off the site (e.g. Sales Agency).' },
    },
  ],
}
