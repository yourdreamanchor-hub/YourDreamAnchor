import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access'
import { imageField } from '../fields/media'
import { revalidateSite } from '../hooks/revalidateSite'
import { cities, cityPath, type City } from '../lib/locations'
import { previewURL } from '../lib/site-origin'

export const CityPages: CollectionConfig = {
  slug: 'city-pages',
  labels: { singular: 'City page', plural: 'City pages' },
  admin: {
    group: 'Website',
    useAsTitle: 'city',
    defaultColumns: ['city', 'published', 'metaTitle', 'updatedAt'],
    description:
      'Mumbai and Bengaluru booking pages. Opening button labels come from Home page → Hero. Event videos with a matching location appear automatically. Save publishes edits; turn off Show on website to hide a page and its links.',
    livePreview: {
      url: ({ data, req }) =>
        data.city && cities.some(({ value }) => value === data.city)
          ? new URL(cityPath(data.city as City), previewURL(req.url)).href
          : previewURL(req.url),
    },
  },
  access: {
    read: ({ req }) => (req.user ? true : { published: { equals: true } }),
    create: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  hooks: { afterChange: [revalidateSite], afterDelete: [revalidateSite] },
  fields: [
    {
      name: 'city',
      type: 'select',
      options: cities.map(({ label, value }) => ({ label, value })),
      required: true,
      unique: true,
    },
    {
      name: 'published',
      label: 'Show on website',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Only published pages appear in the sitemap and home page links.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Page content',
          fields: [
            {
              name: 'headline',
              type: 'text',
              required: true,
              admin: {
                description:
                  'The page’s main heading. Wrap a word in *asterisks* for gold italics.',
              },
            },
            { name: 'intro', type: 'textarea', required: true },
            imageField({
              name: 'image',
              admin: {
                description:
                  'Opening photo. Leave empty to use this city’s photo from Home page → Destinations.',
              },
            }),
            { name: 'imageCaption', type: 'text' },
            {
              name: 'servicesHeading',
              type: 'text',
              required: true,
              admin: { description: 'The services themselves come from Home page → Services.' },
            },
            { name: 'momentsHeading', type: 'text', required: true },
            { name: 'momentsIntro', type: 'textarea' },
            { name: 'planningHeading', type: 'text', required: true },
            { name: 'planningBody', type: 'textarea', required: true },
            { name: 'contactHeading', type: 'text', required: true },
            { name: 'contactBody', type: 'textarea' },
          ],
        },
        {
          label: 'Booking questions',
          fields: [
            {
              name: 'questions',
              type: 'array',
              maxRows: 8,
              admin: { initCollapsed: true },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'metaTitle',
              label: 'Search title',
              type: 'text',
              required: true,
              admin: {
                description:
                  'A clear, unique title with the service and city. Around 50–60 characters is a useful guide, not a limit.',
              },
            },
            {
              name: 'metaDescription',
              label: 'Search description',
              type: 'textarea',
              required: true,
              admin: {
                description:
                  'Describe this city page naturally. Search engines may choose a different excerpt.',
              },
            },
          ],
        },
      ],
    },
  ],
}
