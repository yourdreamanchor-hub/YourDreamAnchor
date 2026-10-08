'use client'

import React, { useEffect, useState } from 'react'

import { brandWordmark } from '@/lib/brand'
import { BrandMark } from './BrandMark'

/** A finite first-view introduction; the website stays usable underneath it. */
export function BrandIntro({ brand, logo }: { brand: string; logo: string }) {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!visible) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const timers = new Set<ReturnType<typeof setTimeout>>()
    let cancelled = false
    let finished = false
    const started = performance.now()
    const later = (callback: () => void, delay: number) => {
      const timer = setTimeout(callback, delay)
      timers.add(timer)
    }
    const dismiss = () => {
      finished = true
      setVisible(false)
    }
    const leave = () => {
      if (cancelled || finished) return
      finished = true
      setLeaving(true)
      later(() => setVisible(false), 320)
    }
    const onPreference = () => {
      if (reduce.matches) dismiss()
    }
    const onVisibility = () => {
      if (document.hidden) dismiss()
    }

    // Deep links and a restored scroll position should open directly at their destination.
    if (
      reduce.matches ||
      document.hidden ||
      window.scrollY > 24 ||
      (location.hash && location.hash !== '#top')
    ) {
      dismiss()
      return
    }

    const media = document.querySelector<HTMLVideoElement | HTMLImageElement>(
      '.hero__video video, video.hero__video, img.hero__video',
    )
    const poster = new Image()
    let resolveMedia: () => void
    const mediaReady = new Promise<void>((resolve) => {
      resolveMedia = resolve
    })
    const onMediaReady = () => resolveMedia()
    if (
      !media ||
      (media instanceof HTMLVideoElement && media.readyState >= 2) ||
      (media instanceof HTMLImageElement && media.complete)
    ) {
      onMediaReady()
    } else {
      media.addEventListener('loadeddata', onMediaReady, { once: true })
      media.addEventListener('load', onMediaReady, { once: true })
      media.addEventListener('error', onMediaReady, { once: true })
      const posterUrl = media instanceof HTMLVideoElement ? media.poster : media.src
      if (posterUrl) {
        poster.onload = onMediaReady
        poster.onerror = onMediaReady
        poster.src = posterUrl
        if (poster.complete) onMediaReady()
      }
    }

    // Wait for the opening poster/frame and fonts, rather than the entire video download.
    Promise.all([document.fonts?.ready ?? Promise.resolve(), mediaReady]).then(() => {
      if (!cancelled && !finished) later(leave, Math.max(0, 1000 - (performance.now() - started)))
    })
    later(leave, 2000)
    document.addEventListener('keydown', dismiss)
    document.addEventListener('pointerdown', dismiss, { passive: true })
    window.addEventListener('scroll', dismiss, { passive: true })
    reduce.addEventListener('change', onPreference)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      poster.onload = null
      poster.onerror = null
      media?.removeEventListener('loadeddata', onMediaReady)
      media?.removeEventListener('load', onMediaReady)
      media?.removeEventListener('error', onMediaReady)
      document.removeEventListener('keydown', dismiss)
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('scroll', dismiss)
      reduce.removeEventListener('change', onPreference)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [visible])

  if (!visible) return null
  return (
    <div className="brand-intro" data-leaving={leaving || undefined} aria-hidden="true">
      <div className="brand-intro__identity">
        <BrandMark src={logo} className="brand-intro__mark" animated />
        <span className="brand-intro__name">{brandWordmark(brand)}</span>
      </div>
    </div>
  )
}
