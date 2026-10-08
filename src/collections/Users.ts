import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Admin user', plural: 'Admin users' },
  admin: {
    group: 'Settings',
    useAsTitle: 'email',
    description: 'People who can log in to this admin panel.',
  },
  auth: true,
  fields: [
    // Email and password are added by Payload.
  ],
}
