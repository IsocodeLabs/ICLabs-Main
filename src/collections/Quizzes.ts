import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from '@/access'

export const Quizzes: CollectionConfig = {
  slug: 'quizzes',
  admin: {
    useAsTitle: 'name',
    group: 'Quiz',
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Short (CTA)', value: 'short' },
        { label: 'Long (pre-onboarding)', value: 'long' },
      ],
    },
    { name: 'entryHeading', type: 'text' },
    { name: 'entryCopy', type: 'textarea', admin: { description: 'Entry framing; the direct-contact hatch renders alongside.' } },
    { name: 'closeHeading', type: 'text' },
    { name: 'closeCopy', type: 'textarea' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}

export const QuizStages: CollectionConfig = {
  slug: 'quiz-stages',
  admin: {
    useAsTitle: 'title',
    group: 'Quiz',
    description: 'Long quiz only — themed stages.',
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'quiz', type: 'relationship', relationTo: 'quizzes', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}

export const QuizQuestions: CollectionConfig = {
  slug: 'quiz-questions',
  admin: {
    useAsTitle: 'prompt',
    group: 'Quiz',
    defaultColumns: ['prompt', 'quiz', 'type', 'order'],
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'quiz', type: 'relationship', relationTo: 'quizzes', required: true },
    { name: 'stage', type: 'relationship', relationTo: 'quiz-stages', admin: { description: 'Long quiz only.' } },
    { name: 'order', type: 'number', defaultValue: 0 },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'tap',
      options: [
        { label: 'Image tiles', value: 'image' },
        { label: 'Quick tap', value: 'tap' },
      ],
    },
    { name: 'prompt', type: 'text', required: true },
    { name: 'helperText', type: 'text' },
    {
      name: 'options',
      type: 'array',
      required: true,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'text', required: true },
        { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'For image-tile questions.' } },
        { name: 'signalValue', type: 'text', admin: { description: 'e.g. "costFirst" flags a deal-breaker.' } },
      ],
    },
    {
      name: 'signalKey',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Company size', value: 'companySize' },
        { label: 'Context', value: 'context' },
        { label: 'Budget', value: 'budget' },
        { label: 'Timeline', value: 'timeline' },
        { label: 'Deal-breaker', value: 'dealBreaker' },
        { label: 'Taste', value: 'taste' },
        { label: 'Feeling', value: 'feeling' },
        { label: 'Aspiration', value: 'aspiration' },
      ],
    },
  ],
}
