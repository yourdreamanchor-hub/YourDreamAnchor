import type { CollectionConfig } from 'payload'

import { anyone, loggedIn } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'

const generatedImageAdmin = {
  disableGroupBy: true,
  disableListColumn: true,
  disableListFilter: true,
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'File', plural: 'Media library' },
  admin: {
    listSearchableFields: ['alt', 'filename'],
    group: 'Library',
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    description:
      'Photos and videos used across the website. Upload here, then choose a file in Home page or Event videos. For video, use MP4 (H.264).',
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
      label: 'Description (alt text)',
      type: 'text',
      required: true,
      admin: {
        description: 'Short description of the photo/video (used by screen readers and Google).',
      },
    },
    {
      name: 'thumbnailURL',
      type: 'text',
      admin: generatedImageAdmin,
    },
    {
      name: 'mimeType',
      type: 'text',
      label: 'File type',
      admin: {
        hidden: true,
        readOnly: true,
        components: { Cell: '/components/admin/MediaCells#FileType' },
      },
    },
    {
      name: 'filesize',
      type: 'number',
      label: 'Size',
      admin: {
        hidden: true,
        readOnly: true,
        components: { Cell: '/components/admin/MediaCells#FileSize' },
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/quicktime'],
    imageSizes: [
      { name: 'thumb', width: 480, admin: generatedImageAdmin },
      { name: 'card', width: 960, admin: generatedImageAdmin },
      { name: 'wide', width: 1920, admin: generatedImageAdmin },
    ],
    adminThumbnail: 'thumb',
    focalPoint: true,
  },
}
