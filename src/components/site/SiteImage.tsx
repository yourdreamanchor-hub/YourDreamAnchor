import React from 'react'
import type { Media } from '@/payload-types'
import { asMedia, responsiveImage } from '@/lib/media'

export function SiteImage({
  media,
  alt,
  sizes,
  priority = false,
  className,
}: {
  media: Media | number | null | undefined
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}) {
  const image = responsiveImage(media)
  if (!image) return null
  return (
    <img
      {...image}
      alt={asMedia(media)?.alt || alt}
      sizes={sizes}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  )
}
