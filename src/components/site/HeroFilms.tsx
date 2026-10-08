'use client'

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import type { HeroFilm } from '@/lib/hero-media'

type Selection = { active: number; pending: number | null; previous: number | null }

type MediaConnection = {
  saveData?: boolean
  addEventListener?: EventTarget['addEventListener']
  removeEventListener?: EventTarget['removeEventListener']
}
const connection = () => (navigator as Navigator & { connection?: MediaConnection }).connection
const prefersPause = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(connection()?.saveData)
const isPhone = () => window.matchMedia('(max-width: 800px)').matches
const serverPreference = () => false
const subscribePhone = (changed: () => void) => {
  const query = window.matchMedia('(max-width: 800px)')
  query.addEventListener('change', changed)
  return () => query.removeEventListener('change', changed)
}

/** Keep the current frame visible until the next film has decoded, then dissolve over it. */
export function HeroFilms({ films, children }: { films: HeroFilm[]; children?: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null)
  const pending = useRef<number | null>(null)
  const preparing = useRef<HTMLVideoElement | null>(null)
  const visible = useRef(false)
  const alive = useRef(false)
  const failed = useRef(new Set<number>())
  const updatePlayback = useRef<() => void>(() => {})
  const [selection, setSelection] = useState<Selection>({
    active: 0,
    pending: null,
    previous: null,
  })
  const [playOverride, setPlaying] = useState<boolean | null>(null)
  const subscribePreference = useCallback(
    (changed: () => void) => {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)')
      const network = connection()
      const onChange = () => {
        if (prefersPause()) setPlaying(null)
        changed()
      }
      query.addEventListener('change', onChange)
      network?.addEventListener?.('change', onChange)
      return () => {
        query.removeEventListener('change', onChange)
        network?.removeEventListener?.('change', onChange)
      }
    },
    [setPlaying],
  )
  const pausePreference = useSyncExternalStore(subscribePreference, prefersPause, serverPreference)
  const mobile = useSyncExternalStore(subscribePhone, isPhone, serverPreference)
  const playing = playOverride ?? !pausePreference
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState('')

  const requestFilm = (index: number) => {
    if (!films[index]?.src) return
    failed.current.delete(index)
    const requested = index === selection.active ? null : index
    pending.current = requested
    preparing.current = null
    setError('')
    setSelection((current) => ({ ...current, pending: requested }))
  }

  const failFilm = (index: number) => {
    if (!alive.current) return
    failed.current.add(index)
    if (pending.current === index) {
      pending.current = null
      preparing.current = null
      setSelection((current) => ({ ...current, pending: null }))
    } else if (index === selection.active) {
      setPlaying(false)
    } else return
    setError('Film unavailable. Choose another.')
  }

  const prepareFilm = (index: number, video: HTMLVideoElement) => {
    if (pending.current !== index) {
      updatePlayback.current()
      return
    }
    if (preparing.current === video) return
    preparing.current = video
    const source = video.src
    const reveal = () => {
      if (
        !alive.current ||
        pending.current !== index ||
        !stage.current?.contains(video) ||
        source !== video.src
      )
        return
      pending.current = null
      preparing.current = null
      setSelection((current) => ({ active: index, previous: current.active, pending: null }))
    }
    if (playing && visible.current && !document.hidden) {
      video
        .play()
        .then(reveal)
        .catch((reason: unknown) => {
          if (pending.current === index && source === video.src) {
            if (!(reason instanceof DOMException && reason.name === 'AbortError')) setPlaying(false)
            reveal()
          }
        })
    } else reveal()
  }

  const advance = (index: number) => {
    if (
      index !== selection.active ||
      !playing ||
      focused ||
      !visible.current ||
      document.hidden ||
      pending.current !== null ||
      selection.previous !== null
    )
      return
    for (let offset = 1; offset < films.length; offset++) {
      const next = (index + offset) % films.length
      if (films[next].src && !failed.current.has(next)) {
        requestFilm(next)
        return
      }
    }
    const current = stage.current?.querySelector<HTMLVideoElement>(
      `video[data-film-index="${index}"]`,
    )
    if (current) {
      current.loop = true
      current.play().catch(() => {})
    }
  }

  useEffect(() => {
    const element = stage.current
    if (!element) return
    alive.current = true
    const onVisibility = () => updatePlayback.current()
    const observer =
      'IntersectionObserver' in window
        ? new IntersectionObserver(([entry]) => {
            visible.current = entry.isIntersecting
            updatePlayback.current()
          })
        : null
    if (observer) observer.observe(element)
    else visible.current = true
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      alive.current = false
      pending.current = null
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      element.querySelectorAll('video').forEach((video) => video.pause())
    }
  }, [])

  useEffect(() => {
    updatePlayback.current = () => {
      stage.current?.querySelectorAll<HTMLVideoElement>('video').forEach((video) => {
        const index = Number(video.dataset.filmIndex)
        const canPlay = playing && visible.current && !document.hidden
        if (index === selection.active && canPlay) {
          video.loop = focused || films.length === 1
          video.play().catch(() => {})
        } else if (index !== selection.previous || !canPlay) video.pause()
      })
    }
    updatePlayback.current()
  }, [selection, playing, focused, mobile, films.length])

  useEffect(() => {
    if (selection.previous === null) return
    const timer = setTimeout(() => setSelection((current) => ({ ...current, previous: null })), 700)
    return () => clearTimeout(timer)
  }, [selection.previous])

  useEffect(() => {
    const index = selection.pending
    if (index === null) return
    preparing.current = null
    const video = stage.current?.querySelector<HTMLVideoElement>(
      `video[data-film-index="${index}"]`,
    )
    if (video && video.readyState >= 2) prepareFilm(index, video)
    const timer = setTimeout(() => {
      if (pending.current === index) failFilm(index)
    }, 8000)
    return () => clearTimeout(timer)
    // The requested film owns this deadline; changes in playback mode must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.pending, mobile])

  const opening = films[0]
  if (!opening?.src)
    return (
      <>
        {opening?.poster && <img src={opening.poster} alt="" className="hero__video" />}
        {children}
      </>
    )

  return (
    <>
      <div
        ref={stage}
        className="hero__video"
        aria-hidden="true"
        data-active-film={films[selection.active]?.id}
      >
        {films.map((film, index) => {
          if (
            index !== selection.active &&
            index !== selection.pending &&
            index !== selection.previous
          )
            return null
          return (
            <video
              key={film.id}
              data-film-index={index}
              className={`hero__film${index === selection.active ? ' is-active' : index === selection.previous ? ' is-previous' : ''}`}
              src={mobile ? film.mobileSrc || film.src : film.src}
              poster={mobile ? film.mobilePoster || film.poster : film.poster}
              muted
              playsInline
              preload={index === selection.pending ? 'auto' : 'metadata'}
              onLoadedData={(event) => prepareFilm(index, event.currentTarget)}
              onError={() => failFilm(index)}
              onEnded={() => advance(index)}
              onTimeUpdate={(event) => {
                const video = event.currentTarget
                if (Number.isFinite(video.duration) && video.duration - video.currentTime <= 1.2)
                  advance(index)
              }}
            />
          )
        })}
      </div>
      {children}
      <div
        className="hero__films"
        role="group"
        aria-label="Hero films"
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
        }}
      >
        {films.length > 1 &&
          films.map((film, index) => (
            <button
              key={film.id}
              className="hero__film-choice"
              type="button"
              aria-label={`Show ${film.label.toLowerCase()} film`}
              aria-pressed={selection.active === index}
              aria-busy={selection.pending === index || undefined}
              onClick={() => requestFilm(index)}
            >
              {film.label}
            </button>
          ))}
        <button
          className="hero__playback"
          type="button"
          aria-label={playing ? 'Pause hero films' : 'Play hero films'}
          onClick={() => setPlaying(!playing)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            {playing ? (
              <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="1.75" />
            ) : (
              <path d="m5 3 8 5-8 5V3Z" fill="currentColor" />
            )}
          </svg>
        </button>
        {error && (
          <p className="hero__film-status" role="status">
            {error}
          </p>
        )}
      </div>
    </>
  )
}
