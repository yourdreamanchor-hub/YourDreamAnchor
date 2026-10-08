import type { CollectionConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    listSearchableFields: ['alt', 'filename'],
    group: 'Content',
    description: 'Upload photos and videos here. Videos: MP4 (H.264), ideally under 20 MB.',
  },
  access: {
    read: anyone,
    create: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  hooks: { afterChange: [revalidateSite], afterDelete: [revalidateSite] },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Short description of the photo/video (used by screen readers and Google).' },
    },
  ],
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/quicktime'],
    imageSizes: [
      { name: 'thumb', width: 480 },
      { name: 'card', width: 960 },
      { name: 'wide', width: 1920 },
    ],
    adminThumbnail: 'thumb',
    focalPoint: true,
  },
}
