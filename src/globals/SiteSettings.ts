import type { GlobalConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { imageField } from '../fields/media'
import { defaultNavigation, sectionOptions } from '../lib/site-content'
import { previewURL } from '../lib/site-origin'
import { defaultSeoDescription, defaultSeoTitle } from '../lib/seo'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Settings', livePreview: { url: ({ req }) => previewURL(req.url) } },
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
            {
              name: 'logoStyle',
              label: 'Site logo',
              type: 'select',
              defaultValue: 'monogram',
              options: [
                { label: 'Original white monogram', value: 'monogram' },
                { label: 'Your uploaded logo', value: 'upload' },
              ],
            },
            imageField({
              name: 'logo',
              admin: {
                condition: (_, row) => row.logoStyle === 'upload',
                description:
                  'Site monogram, shown in the loading intro, scrolled header, footer and browser tab. Use a white SVG or transparent PNG. Leave empty for the original monogram.',
              },
            }),
          ],
        },
        {
          label: 'Header & motion',
          fields: [
            {
              name: 'navigation',
              label: 'Header links',
              type: 'array',
              maxRows: 8,
              labels: { singular: 'Header link', plural: 'Header links' },
              defaultValue: defaultNavigation.map(({ label, value }) => ({
                label,
                section: value,
              })),
              admin: {
                initCollapsed: true,
                components: { RowLabel: '/components/admin/NavLinkLabel' },
                description:
                  'Edit the names and drag to reorder. Links to empty sections are hidden automatically.',
              },
              fields: [
                { name: 'label', type: 'text', required: true },
                {
                  name: 'section',
                  label: 'Link to section',
                  type: 'select',
                  required: true,
                  options: sectionOptions,
                },
              ],
            },
            {
              name: 'bookingLabel',
              label: 'Booking button text',
              type: 'text',
              defaultValue: 'Book a date',
            },
            {
              name: 'footerNote',
              label: 'Footer copyright note',
              type: 'text',
              defaultValue: 'All celebrations reserved.',
            },
            {
              name: 'showLogoIntro',
              label: 'Show the animated logo while the homepage loads',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'scrollAnimations',
              label: 'Animate sections as visitors scroll',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'headerLogoTransition',
              label: 'Form the logo from the name as visitors scroll',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Turn off to keep the name in the header. The original wordmark uses the contour animation; a replacement logo uses a gentle transition.',
              },
            },
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
              defaultValue:
                'Hi Akshay! I found you on your website and would like to check your availability for my celebration.',
              admin: {
                description:
                  'Pre-filled message when a visitor opens the chat. They can edit it before sending.',
              },
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
              label: 'Home page search title',
              type: 'text',
              defaultValue: defaultSeoTitle,
              admin: {
                description:
                  'Name the service and your main cities naturally. City pages have their own search titles.',
              },
            },
            {
              name: 'metaDescription',
              label: 'Home page search description',
              type: 'textarea',
              defaultValue: defaultSeoDescription,
              admin: {
                description:
                  'A concise, accurate introduction for search results. Google may choose a different excerpt.',
              },
            },
            imageField({
              name: 'shareImage',
              admin: {
                description: 'Preview image when the site is shared on WhatsApp, Instagram, etc.',
              },
            }),
            {
              name: 'googleSiteVerification',
              label: 'Google Search Console verification token',
              type: 'text',
              validate: (value: string | null | undefined) =>
                !value ||
                /^[A-Za-z0-9_-]+$/.test(value.trim()) ||
                'Paste only the content value from Google’s HTML tag, without quotes or HTML.',
              admin: {
                description:
                  'In Search Console, add the URL-prefix property https://yourdreamanchor.com/ and choose HTML tag. Paste only its content value here, Save, then return to Google and click Verify. Keep the token after verification. A Domain property uses a DNS record instead. Submit https://yourdreamanchor.com/sitemap.xml once verified.',
              },
            },
          ],
        },
      ],
    },
  ],
}
