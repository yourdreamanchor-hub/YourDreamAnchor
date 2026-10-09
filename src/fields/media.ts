import type { UploadField } from 'payload'

type Options = {
  name: string
  label?: string
  required?: boolean
  admin?: Pick<NonNullable<UploadField['admin']>, 'description' | 'condition'>
}

/** Upload field that only offers photos from the media library. */
export const imageField = ({ admin, ...rest }: Options): UploadField => ({
  type: 'upload',
  relationTo: 'media',
  filterOptions: { mimeType: { contains: 'image' } },
  admin: { ...admin },
  ...rest,
})

/** Upload field that only offers videos from the media library. */
export const videoField = ({ admin, ...rest }: Options): UploadField => ({
  type: 'upload',
  relationTo: 'media',
  filterOptions: { mimeType: { contains: 'video' } },
  admin: { ...admin },
  ...rest,
})
