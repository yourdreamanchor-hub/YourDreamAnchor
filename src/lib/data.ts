import { getPayload } from 'payload'
import { cache } from 'react'

import config from '@/payload.config'
export { asMedia, mediaUrl } from './media'

export const getSiteSettings = cache(async () => {
  const payload = await getPayload({ config: await config })
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
})

export const getCityPages = cache(async () => {
  const payload = await getPayload({ config: await config })
  const pages = await payload.find({
    collection: 'city-pages',
    where: { published: { equals: true } },
    sort: 'city',
    depth: 1,
    pagination: false,
  })
  return pages.docs
})

export const getSiteData = cache(async () => {
  const payload = await getPayload({ config: await config })

  const [home, settings, reels, testimonials] = await Promise.all([
    payload.findGlobal({ slug: 'home', depth: 1 }),
    getSiteSettings(),
    payload.find({
      collection: 'reels',
      where: { featured: { equals: true } },
      sort: 'order',
      limit: 24,
      depth: 1,
    }),
    payload.find({
      collection: 'testimonials',
      where: { featured: { equals: true } },
      sort: 'order',
      pagination: false,
      limit: 0,
      depth: 1,
    }),
  ])

  return { home, settings, reels: reels.docs, testimonials: testimonials.docs }
})

export type SiteData = Awaited<ReturnType<typeof getSiteData>>
