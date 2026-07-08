import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    // email + password come from auth
    {
      name: 'name',
      type: 'text',
    },
  ],
}
