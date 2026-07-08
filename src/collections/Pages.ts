import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from '@/access'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

/** Legal etc. — privacy, terms. */
export const Pages: CollectionConfig = {
  slug: 'pages',
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
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'body', type: 'richText', editor: lexicalEditor() },
  ],
}
