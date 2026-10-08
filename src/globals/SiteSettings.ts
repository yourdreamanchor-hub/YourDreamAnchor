import type { GlobalConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { imageField } from '../fields/media'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: loggedIn },
  hooks: { afterChange: [revalidateSite] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Brand',
          fields: [
            { name: 'brandName', type: 'text', required: true, defaultValue: 'Your Dream Anchor' },
            { name: 'anchorName', type: 'text', required: true, defaultValue: 'Akshay R Takalkar' },
            {
              name: 'role',
              type: 'text',
              defaultValue: 'Wedding & Event Anchor',
              admin: { description: 'Shown under the name, e.g. "Wedding & Event Anchor".' },
            },
            imageField({
              name: 'logo',
              admin: { description: 'Round logo in the menu bar and browser tab. Square image, at least 200×200.' },
            }),
          ],
        },
        {
          label: 'Contact & WhatsApp',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'phone',
                  type: 'text',
                  admin: {
                    placeholder: '+91 98765 43210',
                    description: 'Shown on the site as a tap-to-call link.',
                  },
                },
                { name: 'email', type: 'email', admin: { description: 'Shown on the site.' } },
              ],
            },
            {
              name: 'whatsapp',
              type: 'text',
              label: 'WhatsApp number',
              validate: (value: string | null | undefined) =>
                !value || /^\+?[\d\s-]{10,16}$/.test(value)
                  ? true
                  : 'Enter the number with country code, e.g. +91 98765 43210',
              admin: {
                placeholder: '+91 98765 43210',
                description:
                  'With country code. Visitors tap a button and WhatsApp opens a chat with this number. Leave empty to hide all WhatsApp buttons.',
              },
            },
            {
              name: 'whatsappMessage',
              type: 'textarea',
              label: 'WhatsApp greeting',
              defaultValue: 'Hi Akshay! I found you on your website and would like to check your availability for my celebration.',
              admin: { description: 'Pre-filled message when a visitor opens the chat. They can edit it before sending.' },
            },
            {
              name: 'showWhatsAppButton',
              type: 'checkbox',
              label: 'Show the floating WhatsApp button on every page',
              defaultValue: true,
            },
            { name: 'baseCity', type: 'text', defaultValue: 'Mumbai · Bengaluru · Destination' },
          ],
        },
        {
          label: 'Social',
          fields: [
            {
              name: 'instagram',
              type: 'text',
              defaultValue: 'https://www.instagram.com/yourdreamanchor/',
            },
            { name: 'instagramHandle', type: 'text', defaultValue: '@yourdreamanchor' },
            { name: 'youtube', type: 'text' },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'metaTitle',
              type: 'text',
              defaultValue: 'Your Dream Anchor — Akshay R Takalkar, Wedding & Event Anchor',
            },
            {
              name: 'metaDescription',
              type: 'textarea',
              defaultValue:
                'Wedding anchor and emcee for haldi, sangeet, weddings and celebrations across India. Games, music and a crowd that never sits down.',
            },
            imageField({
              name: 'shareImage',
              admin: { description: 'Preview image when the site is shared on WhatsApp, Instagram, etc.' },
            }),
          ],
        },
      ],
    },
  ],
}
