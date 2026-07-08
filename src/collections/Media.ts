import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  upload: {
    staticDir: 'media',
    imageSizes: [
      { name: 'thumbnail', width: 480, position: 'centre' },
      { name: 'card', width: 1024, position: 'centre' },
      { name: 'full', width: 1920, position: 'centre' },
    ],
    formatOptions: { format: 'webp', options: { quality: 85 } },
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Required — SEO + accessibility.' },
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
}
