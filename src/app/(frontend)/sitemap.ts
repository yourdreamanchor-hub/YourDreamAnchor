import type { MetadataRoute } from 'next'
import { getCityPages, getSiteData } from '@/lib/data'
import { cityPath, isInCity } from '@/lib/locations'
import { asMedia, mediaUrl } from '@/lib/media'
import { absolutePublicURL, canonicalURL, latestModified } from '@/lib/seo'

export const revalidate = 60

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ home, settings, reels, testimonials }, pages] = await Promise.all([
    getSiteData(),
    getCityPages(),
  ])
  const photos = [
    home.about?.portrait,
    settings.shareImage,
    ...(home.gallery || []).map((item) => item.image),
    ...(home.destinations || []).map((item) => item.image),
    ...(home.services || []).map((item) => item.image),
  ]
  const images = [
    ...new Set(
      photos
        .map((photo) => absolutePublicURL(mediaUrl(photo, 'wide')))
        .filter((url): url is string => Boolean(url)),
    ),
  ]
  return [
    {
      url: canonicalURL(),
      images,
      lastModified: latestModified(
        home.updatedAt,
        settings.updatedAt,
        ...reels.map((r) => r.updatedAt),
        ...testimonials.map((t) => t.updatedAt),
        ...photos.map((photo) => asMedia(photo)?.updatedAt),
        ...pages.map((p) => p.updatedAt),
      ),
    },
    { url: canonicalURL('/privacy') },
    ...pages.map((page) => {
      const image = page.image || home.destinations?.find((d) => isInCity(d.city, page.city))?.image
      const imageURL = absolutePublicURL(mediaUrl(image, 'wide'))
      return {
        url: canonicalURL(cityPath(page.city)),
        lastModified: latestModified(
          page.updatedAt,
          home.updatedAt,
          settings.updatedAt,
          asMedia(image)?.updatedAt,
          ...reels.filter((r) => isInCity(r.location, page.city)).map((r) => r.updatedAt),
        ),
        images: imageURL ? [imageURL] : undefined,
      }
    }),
  ]
}
