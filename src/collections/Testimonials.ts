import type { CollectionConfig, TextFieldValidation } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { imageField } from '../fields/media'
import { feedbackAudiences, feedbackSource } from '../lib/feedback'

const validateSource: TextFieldValidation = (value, { siblingData }) =>
  !value || feedbackSource(value, (siblingData as { sourcePlatform?: string }).sourcePlatform)
    ? true
    : 'Use an HTTPS link to the original comment on the selected platform.'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    listSearchableFields: ['name', 'quote', 'event', 'sourceHandle'],
    group: 'Content',
    useAsTitle: 'name',
    defaultColumns: ['name', 'audience', 'sourcePlatform', 'featured', 'order'],
    description:
      'Real celebration feedback and public comments. Every imported comment links to its original source.',
  },
  defaultSort: 'order',
  access: {
    read: anyone,
    create: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  hooks: { afterChange: [revalidateSite], afterDelete: [revalidateSite] },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { placeholder: 'Neha & Vineeth' } },
        { name: 'event', type: 'text', admin: { placeholder: 'Wedding · Mumbai' } },
      ],
    },
    imageField({
      name: 'photo',
      admin: { description: 'Optional photo of the author or couple.' },
    }),
    {
      type: 'row',
      fields: [
        {
          name: 'audience',
          label: 'Feedback from',
          type: 'select',
          required: true,
          defaultValue: 'celebration',
          options: [...feedbackAudiences],
        },
        {
          name: 'sourcePlatform',
          label: 'Original source',
          type: 'select',
          required: true,
          defaultValue: 'other',
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Other / direct feedback', value: 'other' },
          ],
        },
      ],
    },
    {
      name: 'sourceHandle',
      label: 'Author’s social handle',
      type: 'text',
      admin: { placeholder: '@yourguest' },
    },
    {
      name: 'sourceUrl',
      label: 'Original comment link',
      type: 'text',
      validate: validateSource,
      admin: {
        description:
          'The website shows a link to this original comment. Leave empty for direct feedback.',
      },
    },
    { name: 'sourceId', type: 'text', unique: true, admin: { hidden: true } },
    {
      type: 'row',
      fields: [
        { name: 'featured', label: 'Show on website', type: 'checkbox', defaultValue: true },
        {
          name: 'order',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Lower numbers appear first. The first three lead the section.' },
        },
      ],
    },
  ],
}
