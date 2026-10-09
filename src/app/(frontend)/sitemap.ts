import type { MetadataRoute } from 'next'
import { siteOrigin } from '@/lib/site-origin'

const base = siteOrigin()

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
