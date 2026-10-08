'use client'

import React, { useEffect, useRef } from 'react'

/** Muted looping background video that stays paused for reduced-motion users and while off-screen. */
export function BgVideo({ src, poster, className }: { src?: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !reduce.matches) v.play().catch(() => {})
      else v.pause()
    })
    io.observe(v)
    return () => io.disconnect()
  }, [])

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
