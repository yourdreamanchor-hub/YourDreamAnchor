import type { CollectionConfig, TextFieldValidation, UploadFieldValidation } from 'payload'
import { upload } from 'payload/shared'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { imageField, videoField } from '../fields/media'
import { youtubeVideoId } from '../lib/youtube'

const validateYouTube: TextFieldValidation = (value, { siblingData }) =>
  (siblingData as { mediaSource?: string }).mediaSource !== 'youtube' || youtubeVideoId(value)
    ? true
    : 'Paste a valid YouTube video link, for example https://www.youtube.com/watch?v=zR7TZuHqzy8.'

const validateVideo: UploadFieldValidation = (value, args) =>
  (args.siblingData as { mediaSource?: string }).mediaSource === 'youtube' || Boolean(value)
    ? upload(value, args)
    : 'Choose a video from the media library, or switch the video source to YouTube.'

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
  labels: { singular: 'Event video', plural: 'Event videos' },
  admin: {
    listSearchableFields: ['title', 'location', 'caption'],
    group: 'Library',
    useAsTitle: 'title',
    defaultColumns: ['title', 'mediaSource', 'category', 'featured', 'order'],
    description: 'Uploaded clips and YouTube wedding films shown in the "Moments" showcase.',
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
        {
          name: 'mediaSource',
          label: 'Video source',
          type: 'select',
          required: true,
          defaultValue: 'upload',
          options: [
            { label: 'Uploaded video', value: 'upload' },
            { label: 'YouTube video', value: 'youtube' },
          ],
        },
        {
          name: 'orientation',
          label: 'Video shape',
          type: 'select',
          required: true,
          defaultValue: 'portrait',
          options: [
            { label: 'Portrait (9:16)', value: 'portrait' },
            { label: 'Landscape (16:9)', value: 'landscape' },
          ],
          admin: { description: 'Match the original footage so the player keeps its proportions.' },
        },
      ],
    },
    {
      name: 'youtubeUrl',
      label: 'YouTube video link',
      type: 'text',
      admin: {
        condition: (_, data) => data.mediaSource === 'youtube',
        placeholder: 'https://www.youtube.com/watch?v=…',
        description:
          'Paste a public video or Shorts link. Its YouTube cover appears automatically; an uploaded cover below overrides it. Embedding must be enabled on YouTube.',
      },
      validate: validateYouTube,
    },
    {
      type: 'row',
      fields: [
        {
          ...videoField({
            name: 'video',
            admin: {
              condition: (_, data) => data.mediaSource !== 'youtube',
              description: 'MP4, ideally under 20 MB. Choose the matching video shape above.',
            },
          }),
          validate: validateVideo,
        },
        imageField({
          name: 'poster',
          admin: {
            description:
              'Optional cover image. YouTube videos use their original cover by default.',
          },
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
