'use client'

import React, { useEffect, useRef } from 'react'

/** Muted looping background video that stays paused for reduced-motion users and while off-screen. */
export function BgVideo({
  src,
  poster,
  className,
}: {
  src?: string
  poster?: string
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false
    const update = () => {
      if (visible && !reduce.matches && !document.hidden) v.play().catch(() => {})
      else v.pause()
    }
    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting
            update()
          })
        : null
    if (io) io.observe(v)
    else {
      visible = true
      update()
    }
    reduce.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      io?.disconnect()
      reduce.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', update)
      v.pause()
    }
  }, [src])

  if (!src) return poster ? <img src={poster} alt="" className={className} /> : null

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
    />
  )
}
