'use client'

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { youtubeVideo } from '@/lib/youtube'

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
  mediaSource?: 'upload' | 'youtube'
  youtubeUrl?: string | null
  orientation?: 'portrait' | 'landscape'
}

type TileProps = { reel: ReelCard; onOpen: (button: HTMLButtonElement) => void }

function YouTubeIcon() {
  return (
    <svg width="21" height="15" viewBox="0 0 24 17" fill="none" aria-hidden="true">
      <rect width="24" height="17" rx="5" fill="currentColor" />
      <path d="m10 5 6 3.5-6 3.5V5Z" fill="var(--bg)" />
    </svg>
  )
}

function FilmTile({ reel, onOpen }: TileProps) {
  const youtube = youtubeVideo(reel.youtubeUrl)
  const [fallback, setFallback] = useState(false)
  const [failed, setFailed] = useState(false)
  const cover = reel.poster || (fallback ? youtube?.fallbackPoster : youtube?.poster)

  return (
    <button
      className="wedding-film"
      data-reveal="card"
      onClick={(event) => onOpen(event.currentTarget)}
      aria-label={`Play: ${reel.title}`}
    >
      <span className="wedding-film__cover">
        {cover && !failed ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={(event) => {
              // YouTube sometimes returns a 120px placeholder with a successful HTTP response.
              if (youtube && !reel.poster && !fallback && event.currentTarget.naturalWidth < 480)
                setFallback(true)
            }}
            onError={() => {
              if (youtube && !reel.poster && !fallback) setFallback(true)
              else setFailed(true)
            }}
          />
        ) : !youtube && reel.video ? (
          <video src={reel.video} poster={reel.poster} muted playsInline preload="none" />
        ) : null}
        <span className="wedding-film__play" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="m9 5 11 7-11 7V5Z" />
          </svg>
        </span>
      </span>
      <span className="wedding-film__details">
        <span className="wedding-film__source">
          {youtube && <YouTubeIcon />}
          {reel.categoryLabel}
        </span>
        <strong>{reel.title}</strong>
        {reel.location && <small>{reel.location}</small>}
      </span>
    </button>
  )
}

function ReelTile({ reel, onOpen }: TileProps) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      if (reduce.matches || document.hidden) video.pause()
    }
    const observer =
      'IntersectionObserver' in window
        ? new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) video.pause()
          })
        : null
    observer?.observe(video)
    reduce.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer?.disconnect()
      reduce.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', update)
      video.pause()
    }
  }, [reel.video])

  const play = () => {
    if (
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      ref.current?.play().catch(() => {})
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
      data-reveal="card"
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
      onClick={(event) => {
        stop()
        onOpen(event.currentTarget)
      }}
      aria-label={`Play: ${reel.title}`}
    >
      <video
        ref={ref}
        src={reel.video}
        poster={reel.poster}
        muted
        loop
        playsInline
        preload="none"
      />
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

function YouTubePlayer({ url, title }: { url: string; title: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <>
      {!loaded && (
        <span className="lightbox__loading" role="status">
          Loading YouTube player…
        </span>
      )}
      <iframe
        src={url}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setLoaded(true)}
      />
    </>
  )
}

export function Moments({
  reels,
  youtubeChannel,
}: {
  reels: ReelCard[]
  youtubeChannel?: string | null
}) {
  const [filter, setFilter] = useState('all')
  const [active, setActive] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const titleId = useId()
  const playable = useMemo(
    () =>
      reels.filter((reel) =>
        reel.mediaSource === 'youtube' ? youtubeVideo(reel.youtubeUrl) : reel.video,
      ),
    [reels],
  )

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    playable.forEach((r) => seen.set(r.category, r.categoryLabel))
    return [...seen.entries()]
  }, [playable])

  const { films, clips, shown } = useMemo(() => {
    const filtered = filter === 'all' ? playable : playable.filter((r) => r.category === filter)
    const films = filtered.filter(
      (r) => r.mediaSource === 'youtube' || r.orientation === 'landscape',
    )
    const clips = filtered.filter(
      (r) => r.mediaSource !== 'youtube' && r.orientation !== 'landscape',
    )
    return { films, clips, shown: [...films, ...clips] }
  }, [filter, playable])
  const activeIndex = shown.findIndex((reel) => reel.id === active)
  const current = activeIndex >= 0 ? shown[activeIndex] : null
  const youtube = current?.mediaSource === 'youtube' ? youtubeVideo(current.youtubeUrl) : undefined

  const close = useCallback(() => {
    dialogRef.current?.close()
    setActive(null)
    openerRef.current?.focus({ preventScroll: true })
  }, [])

  const step = useCallback(
    (d: number) =>
      setActive((id) => {
        const index = shown.findIndex((reel) => reel.id === id)
        return index < 0 ? null : shown[(index + d + shown.length) % shown.length].id
      }),
    [shown],
  )

  useEffect(() => {
    if (!current) {
      dialogRef.current?.close()
      return
    }
    if (dialogRef.current?.open) return
    dialogRef.current?.showModal()
    closeRef.current?.focus()
  }, [current])

  const isOpen = Boolean(current)
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

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
      <div className="moments__toolbar">
        {categories.length > 1 && (
          <div className="chips" role="group" aria-label="Filter by ceremony">
            {[['all', 'All'] as const, ...categories].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={filter === value}
                className={`chip ${filter === value ? 'is-active' : ''}`}
                onClick={() => {
                  close()
                  setFilter(value)
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {youtubeChannel && playable.some((r) => r.mediaSource === 'youtube') && (
          <a
            href={youtubeChannel}
            target="_blank"
            rel="noreferrer"
            className="moments__channel link"
          >
            <YouTubeIcon /> More on YouTube <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      {films.length > 0 && (
        <div className="wedding-films" data-reveal-group>
          {films.map((r) => (
            <FilmTile
              key={`${r.id}:${r.poster}:${r.youtubeUrl}`}
              reel={r}
              onOpen={(button) => {
                openerRef.current = button
                setActive(r.id)
              }}
            />
          ))}
        </div>
      )}
      {clips.length > 0 && (
        <div className="reels" data-reveal-group>
          {clips.map((r) => (
            <ReelTile
              key={r.id}
              reel={r}
              onOpen={(button) => {
                openerRef.current = button
                setActive(r.id)
              }}
            />
          ))}
        </div>
      )}

      <dialog
        ref={dialogRef}
        className={`lightbox ${current?.orientation === 'landscape' ? 'lightbox--landscape' : ''}`}
        aria-labelledby={titleId}
        onClose={() => {
          setActive(null)
          openerRef.current?.focus({ preventScroll: true })
        }}
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        {current && (
          <>
            <div className="lightbox__top">
              <span>
                {youtube ? 'YouTube · ' : ''}
                {current.categoryLabel}
              </span>
              <button
                ref={closeRef}
                className="lightbox__close"
                onClick={close}
                aria-label="Close video"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m6 6 12 12M6 18 18 6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
            <div className="lightbox__body">
              <div className="lightbox__media">
                {youtube ? (
                  <YouTubePlayer key={youtube.id} url={youtube.embedUrl} title={current.title} />
                ) : (
                  <video
                    key={current.id}
                    src={current.video}
                    poster={current.poster}
                    controls
                    autoPlay
                    playsInline
                  />
                )}
              </div>
              <div className="lightbox__info">
                <h3 id={titleId}>{current.title}</h3>
                {current.location && <p className="muted">📍 {current.location}</p>}
                {current.caption && <p className="lightbox__caption">{current.caption}</p>}
                {youtube && (
                  <a href={youtube.watchUrl} target="_blank" rel="noreferrer" className="link">
                    Watch on YouTube ↗
                  </a>
                )}
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
                    {activeIndex + 1} / {shown.length}
                  </span>
                  <button onClick={() => step(1)} aria-label="Next video">
                    →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </dialog>
    </>
  )
}
