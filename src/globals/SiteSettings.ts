import type { GlobalConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'

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
            { name: 'logo', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'phone', type: 'text', admin: { placeholder: '+91 98XXX XXXXX' } },
                {
                  name: 'whatsapp',
                  type: 'text',
                  admin: { description: 'Number with country code, digits only, e.g. 919800000000' },
                },
              ],
            },
            { name: 'email', type: 'email' },
            { name: 'baseCity', type: 'text', defaultValue: 'Mumbai, India' },
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
            { name: 'shareImage', type: 'upload', relationTo: 'media' },
          ],
        },
      ],
    },
  ],
}
