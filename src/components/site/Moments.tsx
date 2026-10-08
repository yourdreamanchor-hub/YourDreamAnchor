'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type ReelCard = {
  id: number
  title: string
  category: string
  categoryLabel: string
  location?: string | null
  caption?: string | null
  video?: string
  poster?: string
  instagramUrl?: string | null
}

function ReelTile({ reel, onOpen }: { reel: ReelCard; onOpen: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)

  const play = () => {
    if (window.matchMedia('(hover: hover)').matches) ref.current?.play().catch(() => {})
  }
  const stop = () => {
    const v = ref.current
    if (v) {
      v.pause()
      v.currentTime = 0
    }
  }

  return (
    <button
      className={`reel reel--${reel.category}`}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
      onClick={onOpen}
      aria-label={`Play: ${reel.title}`}
    >
      <video ref={ref} src={reel.video} poster={reel.poster} muted loop playsInline preload="none" />
      <span className="reel__shade" />
      <span className="reel__tag">{reel.categoryLabel}</span>
      <span className="reel__play" aria-hidden>
        ▶
      </span>
      <span className="reel__meta">
        <strong>{reel.title}</strong>
        {reel.location && <small>📍 {reel.location}</small>}
      </span>
    </button>
  )
}

export function Moments({ reels }: { reels: ReelCard[] }) {
  const [filter, setFilter] = useState('all')
  const [active, setActive] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    reels.forEach((r) => seen.set(r.category, r.categoryLabel))
    return [...seen.entries()]
  }, [reels])

  const shown = filter === 'all' ? reels : reels.filter((r) => r.category === filter)
  const current = active !== null ? shown[active] : null

  const close = useCallback(() => {
    dialogRef.current?.close()
    setActive(null)
  }, [])

  const step = useCallback(
    (d: number) => setActive((i) => (i === null ? i : (i + d + shown.length) % shown.length)),
    [shown.length],
  )

  useEffect(() => {
    if (active !== null && !dialogRef.current?.open) dialogRef.current?.showModal()
  }, [active])

  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, step])

  return (
    <>
      {categories.length > 1 && (
        <div className="chips" role="tablist" aria-label="Filter by ceremony">
          {[['all', 'All'] as const, ...categories].map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={filter === value}
              className={`chip ${filter === value ? 'is-active' : ''}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="reels" data-reveal>
        {shown.map((r, i) => (
          <ReelTile key={r.id} reel={r} onOpen={() => setActive(i)} />
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="lightbox"
        onClose={() => setActive(null)}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        {current && (
          <div className="lightbox__body">
            <video key={current.id} src={current.video} poster={current.poster} controls autoPlay playsInline />
            <div className="lightbox__info">
              <span className="eyebrow">{current.categoryLabel}</span>
              <h3>{current.title}</h3>
              {current.location && <p className="muted">📍 {current.location}</p>}
              {current.caption && <p className="lightbox__caption">{current.caption}</p>}
              {current.instagramUrl && (
                <a href={current.instagramUrl} target="_blank" rel="noreferrer" className="link">
                  View on Instagram ↗
                </a>
              )}
              <div className="lightbox__nav">
                <button onClick={() => step(-1)} aria-label="Previous video">
                  ←
                </button>
                <span>
                  {(active ?? 0) + 1} / {shown.length}
                </span>
                <button onClick={() => step(1)} aria-label="Next video">
                  →
                </button>
              </div>
            </div>
            <button className="lightbox__close" onClick={close} aria-label="Close">
              ✕
            </button>
          </div>
        )}
      </dialog>
    </>
  )
}
