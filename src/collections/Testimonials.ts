import type { CollectionConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    group: 'Content',
    useAsTitle: 'name',
    defaultColumns: ['name', 'event', 'order'],
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
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
