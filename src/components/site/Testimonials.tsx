'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import {
  feedbackAudiences,
  feedbackSource,
  type FeedbackAudience,
  type FeedbackPlatform,
} from '@/lib/feedback'

export type FeedbackCard = {
  id: number
  quote: string
  name: string
  event?: string | null
  photo?: string
  audience?: FeedbackAudience | null
  sourcePlatform?: FeedbackPlatform | null
  sourceUrl?: string | null
  sourceHandle?: string | null
}

function Quote({
  review,
  floating,
  duplicate = false,
  expanded,
  onRead,
  onToggle,
}: {
  review: FeedbackCard
  floating: boolean
  duplicate?: boolean
  expanded: boolean
  onRead: (id: number) => void
  onToggle: (id: number) => void
}) {
  const textId = useId()
  const long = review.quote.length > 300
  const collapsed = long && (floating || !expanded)
  const source = feedbackSource(review.sourceUrl, review.sourcePlatform)
  const platform =
    review.sourcePlatform === 'instagram'
      ? 'Instagram'
      : review.sourcePlatform === 'youtube'
        ? 'YouTube'
        : 'original source'

  return (
    <blockquote className="quote" data-review-id={duplicate ? undefined : review.id} tabIndex={-1}>
      <span className="quote__mark" aria-hidden>
        “
      </span>
      <p id={textId} className={collapsed ? 'quote__text quote__text--collapsed' : 'quote__text'}>
        {review.quote}
      </p>
      {long && (
        <button
          type="button"
          className="quote__expand"
          aria-controls={textId}
          aria-expanded={!collapsed}
          tabIndex={duplicate ? -1 : undefined}
          onMouseDown={duplicate ? (event) => event.preventDefault() : undefined}
          onClick={() => {
            if (floating) onRead(review.id)
            else onToggle(review.id)
          }}
        >
          {collapsed ? 'Read full comment' : 'Show less'}
        </button>
      )}
      <footer>
        {review.photo && <img src={review.photo} alt="" loading="lazy" />}
        <div>
          <strong>{review.name}</strong>
          {review.event && <small>{review.event}</small>}
          {source && (
            <a
              className="quote__source"
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={duplicate ? -1 : undefined}
              onMouseDown={duplicate ? (event) => event.preventDefault() : undefined}
              aria-label={`Read the original comment by ${review.sourceHandle || review.name} on ${platform}`}
            >
              {platform === 'original source' ? 'Read original feedback' : `${platform} comment`}
              <svg
                viewBox="0 0 16 16"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                aria-hidden
              >
                <path d="M4 12 12 4M4 4h8v8" />
              </svg>
            </a>
          )}
        </div>
      </footer>
    </blockquote>
  )
}

export function Testimonials({
  reviews,
  motionEnabled = true,
}: {
  reviews: FeedbackCard[]
  motionEnabled?: boolean
}) {
  const [audience, setAudience] = useState('all')
  const [readAll, setReadAll] = useState(false)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [inView, setInView] = useState(true)
  const [visible, setVisible] = useState(true)
  const [preferences, setPreferences] = useState({ ready: false, reduced: false, columns: 3 })
  const [durations, setDurations] = useState<number[]>([])
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(() => new Set())
  const wallId = useId()
  const wall = useRef<HTMLDivElement>(null)
  const keyboardInput = useRef(false)
  const nextFocus = useRef<{ id: number; control?: 'source' | 'expand' } | undefined>(undefined)
  const filtered =
    audience === 'all' ? reviews : reviews.filter((review) => review.audience === audience)
  const columnCount = Math.min(preferences.columns, Math.max(filtered.length, 1))
  const columns = Array.from({ length: columnCount }, (_, index) =>
    filtered.filter((_, position) => position % columnCount === index),
  )
  // A short collection reads better as a complete still layout than a sparse loop.
  const canFloat = motionEnabled && !preferences.reduced && filtered.length >= columnCount * 3
  const floating = canFloat && !readAll
  const moving =
    floating && preferences.ready && inView && visible && !paused && !hovered && !focused
  const filters = feedbackAudiences.filter((kind) =>
    reviews.some((review) => review.audience === kind.value),
  )

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const tablet = window.matchMedia('(max-width: 950px)')
    const phone = window.matchMedia('(max-width: 600px)')
    const update = () =>
      setPreferences({
        ready: true,
        reduced: reduce.matches,
        columns: phone.matches ? 1 : tablet.matches ? 2 : 3,
      })
    const visibility = () => setVisible(!document.hidden)
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') keyboardInput.current = true
    }
    const pointerDown = () => {
      keyboardInput.current = false
    }
    update()
    visibility()
    for (const query of [reduce, tablet, phone]) query.addEventListener('change', update)
    document.addEventListener('visibilitychange', visibility)
    document.addEventListener('keydown', keyDown)
    document.addEventListener('pointerdown', pointerDown)
    return () => {
      for (const query of [reduce, tablet, phone]) query.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('keydown', keyDown)
      document.removeEventListener('pointerdown', pointerDown)
    }
  }, [])

  useEffect(() => {
    const element = wall.current
    if (!element) return
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0,
      rootMargin: '80px 0px',
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [reviews.length])

  useEffect(() => {
    if (!floating || !wall.current) return
    const groups = [...wall.current.querySelectorAll<HTMLElement>('[data-feedback-original]')]
    const measure = () => {
      const heights = groups.map((group) => group.getBoundingClientRect().height)
      if (heights.some((height) => height === 0)) return
      // Keep every column at a quiet 10–12 px/s, regardless of comment length or count.
      const next = heights.map((height, index) => (height + 18) / (index === 1 ? 10 : 12))
      setDurations((previous) =>
        next.every((duration, index) => duration === previous[index]) ? previous : next,
      )
    }
    measure()
    if (!('ResizeObserver' in window)) return
    const observer = new ResizeObserver(measure)
    groups.forEach((group) => observer.observe(group))
    return () => observer.disconnect()
  }, [audience, columnCount, floating, reviews])

  useEffect(() => {
    if (floating || !nextFocus.current) return
    const { id, control } = nextFocus.current
    const quote = wall.current?.querySelector<HTMLElement>(`[data-review-id="${id}"]`)
    const target = control ? quote?.querySelector<HTMLElement>(`.quote__${control}`) : quote
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    nextFocus.current = undefined
  }, [floating])

  const readReview = (id: number) => {
    nextFocus.current = { id }
    setExpandedReviews((previous) => new Set(previous).add(id))
    setReadAll(true)
  }

  const toggleReview = (id: number) => {
    setExpandedReviews((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!reviews.length) return null

  return (
    <div className="love__collection">
      <div className="love__toolbar">
        {filters.length > 1 && (
          <div className="chips love__filters" role="group" aria-label="Filter feedback">
            {[{ value: 'all', label: 'All feedback' }, ...filters].map((kind) => (
              <button
                key={kind.value}
                type="button"
                className={`chip${audience === kind.value ? ' is-active' : ''}`}
                aria-pressed={audience === kind.value}
                aria-controls={wallId}
                onClick={() => {
                  setAudience(kind.value)
                  setReadAll(false)
                  setDurations([])
                }}
              >
                {kind.label}
              </button>
            ))}
          </div>
        )}
        {canFloat && (
          <div className="love__actions">
            {floating && (
              <button
                type="button"
                className="love__motion"
                aria-pressed={paused}
                aria-controls={wallId}
                onClick={() => setPaused(!paused)}
              >
                <svg
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  aria-hidden
                >
                  {paused ? <path d="m5 3 7 5-7 5Z" /> : <path d="M5 3v10M11 3v10" />}
                </svg>
                {paused ? 'Resume' : 'Pause'}
              </button>
            )}
            <button
              type="button"
              className="love__view"
              aria-controls={wallId}
              aria-expanded={!floating}
              onClick={() => setReadAll(!readAll)}
            >
              {floating ? `Read all ${filtered.length}` : 'Back to floating view'}
              <svg
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden
              >
                <path d={floating ? 'M8 3v10M3 8l5 5 5-5' : 'M8 13V3M3 8l5-5 5 5'} />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div
        id={wallId}
        ref={wall}
        className="love__wall"
        data-view={floating ? 'floating' : 'all'}
        data-moving={moving ? 'true' : 'false'}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setHovered(true)
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={(event) => {
          if (event.pointerType === 'touch' || event.pointerType === 'pen') setPaused(true)
        }}
        onFocusCapture={(event) => {
          setFocused(true)
          // Keyboard users get a still, unclipped collection as soon as they enter a card.
          if (floating && (keyboardInput.current || event.target.matches(':focus-visible'))) {
            const quote = event.target.closest<HTMLElement>('[data-review-id]')
            if (quote) {
              nextFocus.current = {
                id: Number(quote.dataset.reviewId),
                control: event.target.classList.contains('quote__source')
                  ? 'source'
                  : event.target.classList.contains('quote__expand')
                    ? 'expand'
                    : undefined,
              }
              setReadAll(true)
            }
          }
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
        }}
      >
        {columns.map((entries, index) => (
          <div key={index} className="love__column">
            <div
              className="love__track"
              style={
                {
                  '--feedback-duration': `${durations[index] || entries.length * 28}s`,
                  '--feedback-delay': `${[0, -12, -6][index]}s`,
                } as React.CSSProperties
              }
            >
              <div className="love__group" data-feedback-original>
                {entries.map((review) => (
                  <Quote
                    key={review.id}
                    review={review}
                    floating={floating}
                    expanded={expandedReviews.has(review.id)}
                    onRead={readReview}
                    onToggle={toggleReview}
                  />
                ))}
              </div>
              {floating && (
                <div className="love__group love__group--copy" aria-hidden="true">
                  {entries.map((review) => (
                    <Quote
                      key={review.id}
                      review={review}
                      floating
                      duplicate
                      expanded={false}
                      onRead={readReview}
                      onToggle={toggleReview}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="love__count" role="status" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'comment' : 'comments'}
      </p>
    </div>
  )
}
