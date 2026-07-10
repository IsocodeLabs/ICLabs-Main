import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from '@/access'

/**
 * Founders — the two people behind Isocode, shown on /about. A deliberate
 * reversal of the old "no people on the site" rule: values-led framing, craft
 * first, not a personality cult. Ordered, CMS-editable (socials added later).
 */
export const Founders: CollectionConfig = {
  slug: 'founders',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'title', 'order'],
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'title', type: 'text', defaultValue: 'Co-founder' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'eduLine',
      type: 'text',
      admin: { description: 'e.g. "B.Tech, IIT Kharagpur".' },
    },
    {
      name: 'socials',
      type: 'array',
      admin: { description: 'Icon links. Leave empty to hide until URLs are ready.' },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          defaultValue: 'linkedin',
          options: [
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'GitHub', value: 'github' },
            { label: 'X', value: 'x' },
          ],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
