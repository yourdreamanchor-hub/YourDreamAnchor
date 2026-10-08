import type { CollectionConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { imageField } from '../fields/media'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    listSearchableFields: ['name', 'quote', 'event'],
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
    imageField({ name: 'photo', admin: { description: 'Optional photo of the couple.' } }),
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}
