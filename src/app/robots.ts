import type { MetadataRoute } from 'next'
import { canonicalURL, indexableEnvironment } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: indexableEnvironment()
      ? { userAgent: '*', allow: ['/', '/api/media/file/'], disallow: ['/admin', '/api'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: canonicalURL('/sitemap.xml'),
  }
}
