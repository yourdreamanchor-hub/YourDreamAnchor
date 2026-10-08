import type { CollectionConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { imageField, videoField } from '../fields/media'

export const reelCategories = [
  { label: 'Haldi', value: 'haldi' },
  { label: 'Mehendi', value: 'mehendi' },
  { label: 'Sangeet', value: 'sangeet' },
  { label: 'Wedding', value: 'wedding' },
  { label: 'Reception', value: 'reception' },
  { label: 'Games & Fun', value: 'games' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Other', value: 'other' },
]

export const Reels: CollectionConfig = {
  slug: 'reels',
  labels: { singular: 'Reel', plural: 'Reels' },
  admin: {
    listSearchableFields: ['title', 'location', 'caption'],
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'location', 'featured', 'order'],
    description: 'Event videos shown in the "Moments" showcase on the home page.',
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
    { name: 'title', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'category', type: 'select', options: reelCategories, required: true },
        { name: 'location', type: 'text', admin: { placeholder: 'St. Regis, Mumbai' } },
      ],
    },
    {
      type: 'row',
      fields: [
        videoField({
          name: 'video',
          required: true,
          admin: { description: 'Vertical (9:16) MP4, ideally under 20 MB.' },
        }),
        imageField({
          name: 'poster',
          admin: { description: 'Cover image shown before the video plays.' },
        }),
      ],
    },
    { name: 'caption', type: 'textarea' },
    { name: 'instagramUrl', type: 'text', label: 'Instagram link' },
    {
      type: 'row',
      fields: [
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: true,
          admin: { description: 'Show on the home page.' },
        },
        {
          name: 'order',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Lower numbers appear first.' },
        },
      ],
    },
  ],
}
