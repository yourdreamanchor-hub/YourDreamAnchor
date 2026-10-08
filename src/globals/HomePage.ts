import type { GlobalConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { imageField, videoField } from '../fields/media'

export const HomePage: GlobalConfig = {
  slug: 'home',
  label: 'Home page',
  admin: {
    group: 'Pages',
    description:
      'Everything on the home page, section by section. Click “Live Preview” (top right) to see changes next to the editor.',
    livePreview: {
      url: `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/`,
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
                  admin: { description: 'Keep this short so the video has room to breathe. Wrap a word in *asterisks* to show it in gold italics.' },
                },
                {
                  name: 'subheadline',
                  label: 'Optional supporting line',
                  type: 'textarea',
                  admin: { description: 'One short line beneath the name and role, if needed.' },
                },
                {
                  type: 'row',
                  fields: [
                    videoField({
                      name: 'video',
                      admin: { description: 'Background video: short (10–15 s), landscape, no sound needed.' },
                    }),
                    imageField({
                      name: 'poster',
                      admin: { description: 'Shown while the video loads, and on slow connections.' },
                    }),
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
              labels: { singular: 'Word', plural: 'Words' },
              admin: { description: 'The celebration and destination labels beneath the hero.' },
              fields: [{ name: 'text', type: 'text', required: true }],
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
                imageField({ name: 'portrait', admin: { description: 'Portrait photo of Akshay (tall photos work best).' } }),
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
                    { name: 'label', type: 'text', required: true, admin: { placeholder: 'Events hosted' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Services',
          fields: [
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
            { name: 'momentsHeading', type: 'text', defaultValue: 'Moments we made loud.' },
            {
              name: 'momentsIntro',
              type: 'textarea',
              admin: { description: 'The videos themselves are managed under Content → Reels.' },
            },
          ],
        },
        {
          label: 'Gallery',
          fields: [
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
                videoField({ name: 'video', admin: { description: 'Shown inside the phone frame. Vertical video.' } }),
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
            { name: 'destinationsHeading', type: 'text', defaultValue: 'From skyline ballrooms to palace courtyards.' },
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
            { name: 'testimonialsHeading', type: 'text', defaultValue: 'What the families said.' },
            {
              name: 'contact',
              type: 'group',
              fields: [
                { name: 'heading', type: 'text', defaultValue: 'Is your date still open?' },
                { name: 'body', type: 'textarea' },
                { name: 'successMessage', type: 'text', defaultValue: 'Thank you! We’ll call you within a day.' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
