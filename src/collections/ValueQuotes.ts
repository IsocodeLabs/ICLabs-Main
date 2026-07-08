import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from '@/access'

/** Rotating values-quote pool — hero + quiz screens. */
export const ValueQuotes: CollectionConfig = {
  slug: 'value-quotes',
  admin: {
    useAsTitle: 'quote',
    group: 'Content',
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'quote', type: 'text', required: true },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
