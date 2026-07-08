import type { GlobalConfig } from 'payload'
import { adminOnly, publicRead } from '@/access'

/** All flat homepage copy — one block-structured global. */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: { group: 'Content' },
  access: {
    read: publicRead,
    update: adminOnly,
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'beliefLine', type: 'textarea', admin: { description: 'LOCKED belief line.' } },
        { name: 'subline', type: 'text' },
        {
          name: 'scrollBeats',
          type: 'array',
          admin: { description: 'The scroll-reveal journey — text changes in place.' },
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'problem',
      type: 'group',
      fields: [
        {
          name: 'narrative',
          type: 'array',
          admin: { description: 'One paragraph per row — revealed as they scroll.' },
          fields: [{ name: 'text', type: 'textarea', required: true }],
        },
      ],
    },
    {
      name: 'whatWeBuild',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text' },
        {
          name: 'body',
          type: 'array',
          fields: [{ name: 'text', type: 'textarea', required: true }],
        },
      ],
    },
    {
      name: 'labsIntro',
      type: 'group',
      fields: [
        { name: 'beliefBeat', type: 'text', admin: { description: 'The stated belief transition in.' } },
        { name: 'heading', type: 'text' },
        { name: 'body', type: 'textarea' },
      ],
    },
    {
      name: 'creatorMention',
      type: 'group',
      fields: [
        { name: 'body', type: 'textarea' },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'body', type: 'textarea' },
        { name: 'quizLabel', type: 'text' },
        { name: 'hatchLabel', type: 'text' },
      ],
    },
    {
      name: 'about',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text' },
        {
          name: 'body',
          type: 'array',
          fields: [{ name: 'text', type: 'textarea', required: true }],
        },
        { name: 'teamLine', type: 'text', admin: { description: 'The "small senior team, top-0.5% bar" line — present, not headlined.' } },
        { name: 'contactHeading', type: 'text' },
      ],
    },
  ],
}
