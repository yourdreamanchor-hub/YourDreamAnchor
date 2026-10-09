import type { Media } from '@/payload-types'

type MaybeMedia = Media | number | null | undefined
export function asMedia(media: MaybeMedia): Media | null {
  return media && typeof media === 'object' ? media : null
}

export function mediaUrl(media: MaybeMedia, size?: 'thumb' | 'card' | 'wide'): string | undefined {
  const upload = asMedia(media)
  return upload ? (size && upload.sizes?.[size]?.url) || upload.url || undefined : undefined
}
