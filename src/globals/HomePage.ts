import type { GlobalConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { imageField, videoField } from '../fields/media'
import { previewURL } from '../lib/site-origin'
import { sectionOptions } from '../lib/site-content'

export const HomePage: GlobalConfig = {
  slug: 'home',
  label: 'Home page',
  admin: {
    group: 'Website',
    description:
      'Edit the home page section by section. Save to publish your changes; Live Preview shows the saved website beside the editor.',
    livePreview: {
      url: ({ req }) => previewURL(req.url),
      breakpoints: [
        { label: 'Phone', name: 'phone', width: 390, height: 844 },
        { label: 'Laptop', name: 'laptop', width: 1440, height: 900 },
      ],
    },
  },
  access: { read: anyone, update: loggedIn },
  hooks: { afterChange: [revalidateSite] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            {
              name: 'hero',
              type: 'group',
              fields: [
                {
                  name: 'eyebrow',
                  label: 'Short role',
                  type: 'text',
                  defaultValue: 'Wedding & Event Anchor',
                },
                {
                  name: 'headline',
                  label: 'Name or title',
                  type: 'text',
                  required: true,
                  defaultValue: 'Akshay R Takalkar',
                  admin: {
                    description:
                      'Keep this short so the video has room to breathe. Wrap a word in *asterisks* to show it in gold italics.',
                  },
                },
                {
                  name: 'subheadline',
                  label: 'Optional supporting line',
                  type: 'textarea',
                  admin: { description: 'One short line beneath the name and role, if needed.' },
                },
                {
                  name: 'films',
                  label: 'Hero films',
                  type: 'array',
                  maxRows: 8,
                  defaultValue: [
                    { label: 'Wedding', source: 'wedding', enabled: true },
                    { label: 'Sangeet', source: 'sangeet', enabled: true },
                    { label: 'Haldi', source: 'haldi', enabled: true },
                    { label: 'Games', source: 'games', enabled: true },
                  ],
                  admin: {
                    description:
                      'The films currently shown in the hero. Drag to reorder, change the labels, or choose Your upload to replace a film. Turn off Show this film to hide it.',
                    initCollapsed: true,
                    components: { RowLabel: '/components/admin/HeroFilmLabel' },
                  },
                  fields: [
                    { name: 'label', label: 'Film label', type: 'text', required: true },
                    {
                      name: 'source',
                      label: 'Video',
                      type: 'select',
                      required: true,
                      defaultValue: 'upload',
                      options: [
                        { label: 'Wedding — approved film', value: 'wedding' },
                        { label: 'Sangeet — approved film', value: 'sangeet' },
                        { label: 'Haldi — approved film', value: 'haldi' },
                        { label: 'Games — approved film', value: 'games' },
                        { label: 'Your upload', value: 'upload' },
                      ],
                    },
                    {
                      name: 'enabled',
                      label: 'Show this film',
                      type: 'checkbox',
                      defaultValue: true,
                    },
                    videoField({
                      name: 'video',
                      label: 'Landscape video',
                      admin: {
                        condition: (_, row) => row.source === 'upload',
                        description: 'MP4, around 10–15 seconds. Used on computers.',
                      },
                    }),
                    imageField({
                      name: 'poster',
                      label: 'Landscape cover',
                      admin: {
                        description:
                          'Optional cover override. Shown before the video is ready or when motion is paused.',
                      },
                    }),
                    videoField({
                      name: 'mobileVideo',
                      label: 'Phone video (optional)',
                      admin: {
                        description:
                          'Optional portrait crop for phones. Leave empty to use the approved phone crop, or your landscape video.',
                      },
                    }),
                    imageField({
                      name: 'mobilePoster',
                      label: 'Phone cover (optional)',
                      admin: { description: 'Optional cover override for phones.' },
                    }),
                  ],
                  validate: (rows) =>
                    !Array.isArray(rows) ||
                    rows.every((value) => {
                      if (!value || typeof value !== 'object') return false
                      const row = value as { enabled?: boolean; source?: string; video?: unknown }
                      return row.enabled === false || row.source !== 'upload' || Boolean(row.video)
                    })
                      ? true
                      : 'Choose a landscape video for every enabled upload film.',
                },
                {
                  name: 'autoPlay',
                  label: 'Automatically play and rotate hero films',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description:
                      'Visitors can still choose a film and press Play. Reduced-motion and data-saving preferences take priority.',
                  },
                },
                {
                  type: 'collapsible',
                  label: 'Single-video fallback',
                  admin: {
                    initCollapsed: true,
                    description:
                      'Used only when no hero film list has been set. The existing upload is preserved here.',
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        videoField({
                          name: 'video',
                          admin: {
                            description:
                              'Background video: short (10–15 s), landscape, no sound needed.',
                          },
                        }),
                        imageField({
                          name: 'poster',
                          admin: {
                            description: 'Shown while the video loads, and on slow connections.',
                          },
                        }),
                      ],
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'primaryLabel', type: 'text', defaultValue: 'Check your date' },
                    { name: 'secondaryLabel', type: 'text', defaultValue: 'Watch the moments' },
                  ],
                },
              ],
            },
            {
              name: 'marquee',
              label: 'Below the hero',
              type: 'array',
              labels: { singular: 'Label', plural: 'Labels' },
              admin: { description: 'The celebration and destination labels beneath the hero.' },
              fields: [
                { name: 'text', type: 'text', required: true },
                {
                  name: 'section',
                  label: 'Link to',
                  type: 'select',
                  defaultValue: 'auto',
                  options: [
                    { label: 'Automatic', value: 'auto' },
                    { label: 'No link', value: 'none' },
                    ...sectionOptions,
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'About',
          fields: [
            {
              name: 'about',
              type: 'group',
              fields: [
                { name: 'kicker', type: 'text', defaultValue: 'Meet your anchor' },
                { name: 'heading', type: 'text' },
                { name: 'body', type: 'textarea' },
                imageField({
                  name: 'portrait',
                  admin: { description: 'Portrait photo of Akshay (tall photos work best).' },
                }),
                { name: 'signature', type: 'text' },
              ],
            },
            {
              name: 'stats',
              type: 'array',
              maxRows: 4,
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'value', type: 'text', required: true, admin: { placeholder: '300+' } },
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                      admin: { placeholder: 'Events hosted' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Services',
          fields: [
            {
              name: 'servicesKicker',
              label: 'Small section label',
              type: 'text',
              defaultValue: 'Ceremonies',
            },
            { name: 'servicesHeading', type: 'text', defaultValue: 'One voice, every ceremony.' },
            {
              name: 'services',
              type: 'array',
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'textarea' },
                imageField({ name: 'image' }),
                {
                  name: 'accent',
                  type: 'select',
                  defaultValue: 'gold',
                  options: [
                    { label: 'Gold', value: 'gold' },
                    { label: 'Haldi yellow', value: 'haldi' },
                    { label: 'Rani pink', value: 'rani' },
                    { label: 'Sangeet violet', value: 'violet' },
                    { label: 'Mehendi green', value: 'mehendi' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Moments',
          fields: [
            {
              name: 'momentsKicker',
              label: 'Small section label',
              type: 'text',
              defaultValue: 'Moments',
            },
            { name: 'momentsHeading', type: 'text', defaultValue: 'Moments we made loud.' },
            {
              name: 'momentsIntro',
              type: 'textarea',
              admin: {
                description: 'The videos themselves are managed under Library → Event videos.',
              },
            },
          ],
        },
        {
          label: 'Gallery',
          fields: [
            {
              name: 'galleryKicker',
              label: 'Small section label',
              type: 'text',
              defaultValue: 'Gallery',
            },
            { name: 'galleryHeading', type: 'text', defaultValue: 'Behind the *mic.*' },
            {
              name: 'gallery',
              type: 'array',
              labels: { singular: 'Photo', plural: 'Photos' },
              admin: { description: 'Photos shown in the gallery grid. Drag to reorder.' },
              fields: [
                imageField({ name: 'image', required: true }),
                { name: 'caption', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Games',
          fields: [
            {
              name: 'games',
              type: 'group',
              fields: [
                { name: 'kicker', type: 'text', defaultValue: 'New game alert' },
                { name: 'heading', type: 'text' },
                { name: 'body', type: 'textarea' },
                {
                  name: 'backgroundStyle',
                  label: 'Section background',
                  type: 'select',
                  defaultValue: 'celebration',
                  options: [
                    { label: 'Warm gold celebration artwork', value: 'celebration' },
                    { label: 'Your image', value: 'upload' },
                    { label: 'Plain dark background', value: 'plain' },
                  ],
                },
                imageField({
                  name: 'background',
                  label: 'Background image',
                  admin: {
                    condition: (_, row) => row.backgroundStyle === 'upload',
                    description: 'Wide image with quiet, dark space behind the heading.',
                  },
                }),
                videoField({
                  name: 'video',
                  admin: { description: 'Shown inside the phone frame. Vertical video.' },
                }),
                imageField({ name: 'poster' }),
                {
                  name: 'list',
                  type: 'array',
                  labels: { singular: 'Game', plural: 'Games' },
                  fields: [{ name: 'name', type: 'text', required: true }],
                },
              ],
            },
          ],
        },
        {
          label: 'Destinations',
          fields: [
            {
              name: 'destinationsKicker',
              label: 'Small section label',
              type: 'text',
              defaultValue: 'Where we’ve celebrated',
            },
            {
              name: 'destinationsHeading',
              type: 'text',
              defaultValue: 'From skyline ballrooms to palace courtyards.',
            },
            {
              name: 'destinations',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'city', type: 'text', required: true },
                    { name: 'venue', type: 'text' },
                  ],
                },
                imageField({ name: 'image' }),
              ],
            },
          ],
        },
        {
          label: 'Testimonials & contact',
          fields: [
            {
              name: 'testimonialsKicker',
              label: 'Small section label for testimonials',
              type: 'text',
              defaultValue: 'Kind words',
            },
            { name: 'testimonialsHeading', type: 'text', defaultValue: 'What the families said.' },
            {
              name: 'contact',
              type: 'group',
              fields: [
                {
                  name: 'kicker',
                  label: 'Small section label',
                  type: 'text',
                  defaultValue: 'Bookings',
                },
                { name: 'heading', type: 'text', defaultValue: 'Is your date still open?' },
                { name: 'body', type: 'textarea' },
                {
                  name: 'successMessage',
                  type: 'text',
                  defaultValue: 'Thank you! We’ll call you within a day.',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
