import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from '@/access'

/** Company values — About section + woven copy. */
export const Values: CollectionConfig = {
  slug: 'values',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'text', required: true },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
