import type { Media } from '@/payload-types'

type MaybeMedia = Media | number | null | undefined
export function asMedia(media: MaybeMedia): Media | null {
  return media && typeof media === 'object' ? media : null
}

export function mediaUrl(media: MaybeMedia, size?: 'thumb' | 'card' | 'wide'): string | undefined {
  const upload = asMedia(media)
  return upload ? (size && upload.sizes?.[size]?.url) || upload.url || undefined : undefined
}

/** Payload's image variants preserve the photo's proportions. Browsers choose the right width. */
export function responsiveImage(media: MaybeMedia) {
  const upload = asMedia(media)
  const src = mediaUrl(upload, 'card')
  if (!upload || !src) return undefined
  const candidates = [...Object.values(upload.sizes || {}), upload]
    .filter((size): size is { url: string; width: number } =>
      Boolean(size?.url && size.width && size.width > 0),
    )
    .sort((a, b) => a.width - b.width)
  const unique = [...new Map(candidates.map((size) => [size.width, size.url])).entries()]
  return {
    src,
    srcSet:
      unique.length > 1 ? unique.map(([width, url]) => `${url} ${width}w`).join(', ') : undefined,
    width: upload.width || undefined,
    height: upload.height || undefined,
  }
}
