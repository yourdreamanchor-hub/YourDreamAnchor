import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access'
import { notifyNewInquiry, rateLimitInquiries } from '../hooks/inquiryHooks'

export const eventTypes = [
  { label: 'Wedding (multi-day)', value: 'wedding' },
  { label: 'Haldi / Mehendi', value: 'haldi-mehendi' },
  { label: 'Sangeet', value: 'sangeet' },
  { label: 'Reception', value: 'reception' },
  { label: 'Engagement', value: 'engagement' },
  { label: 'Corporate / Brand event', value: 'corporate' },
  { label: 'Birthday / Private party', value: 'private' },
  { label: 'Something else', value: 'other' },
]

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: { singular: 'Booking enquiry', plural: 'Booking enquiries' },
  admin: {
    listSearchableFields: ['name', 'phone', 'email', 'city'],
    group: 'Bookings',
    useAsTitle: 'name',
    defaultColumns: ['name', 'eventType', 'eventDate', 'city', 'status', 'createdAt'],
    description: 'Booking requests sent from the website contact form.',
  },
  defaultSort: '-createdAt',
  access: {
    // The public form can create inquiries; only the admin can read or change them.
    create: () => true,
    read: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  hooks: {
    beforeValidate: [rateLimitInquiries],
    afterChange: [notifyNewInquiry],
    beforeChange: [
      ({ data, operation, req }) => {
        // Visitors can't set the admin-only fields.
        if (operation === 'create' && !req.user) {
          data.status = 'new'
          delete data.notes
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'reply',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/components/admin/InquiryReply' } },
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, maxLength: 120 },
        { name: 'phone', type: 'text', required: true, maxLength: 30 },
        { name: 'email', type: 'email' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'eventType', type: 'select', options: eventTypes, required: true },
        { name: 'eventDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'city', type: 'text', maxLength: 120 },
        { name: 'guests', type: 'text', maxLength: 30 },
      ],
    },
    { name: 'message', type: 'textarea', maxLength: 3000 },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Booked', value: 'booked' },
        { label: 'Not a fit', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'notes', type: 'textarea', admin: { position: 'sidebar', description: 'Private notes.' } },
    {
      // Salted hash of the sender's IP, used only for rate limiting.
      name: 'ipHash',
      type: 'text',
      index: true,
      admin: { hidden: true },
      access: { read: ({ req }) => Boolean(req.user) },
    },
  ],
}
