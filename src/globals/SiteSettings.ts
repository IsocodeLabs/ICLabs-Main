import type { GlobalConfig } from 'payload'
import { adminOnly, publicRead } from '@/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Content' },
  access: {
    read: publicRead,
    update: adminOnly,
  },
  fields: [
    {
      name: 'nav',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      fields: [
        { name: 'beliefLine', type: 'text' },
        {
          name: 'navLinks',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
        {
          name: 'legalLinks',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
        { name: 'copyright', type: 'text' },
      ],
    },
    {
      name: 'social',
      type: 'array',
      fields: [
        { name: 'platform', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'defaultSEO',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'organizationJSONLD',
      type: 'group',
      fields: [
        { name: 'legalName', type: 'text' },
        { name: 'url', type: 'text' },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        {
          name: 'sameAs',
          type: 'array',
          fields: [{ name: 'url', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'contactChannels',
      type: 'group',
      admin: { description: 'The "in a hurry, talk to us directly" hatch.' },
      fields: [
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
      ],
    },
  ],
}
