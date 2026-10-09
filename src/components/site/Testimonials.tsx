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

function Quote({ review }: { review: FeedbackCard }) {
  const [expanded, setExpanded] = useState(false)
  const textId = useId()
  const long = review.quote.length > 300
  const source = feedbackSource(review.sourceUrl, review.sourcePlatform)
  const platform =
    review.sourcePlatform === 'instagram'
      ? 'Instagram'
      : review.sourcePlatform === 'youtube'
        ? 'YouTube'
        : 'original source'

  return (
    <blockquote className="quote" data-reveal="quote" data-review-id={review.id} tabIndex={-1}>
      <span className="quote__mark" aria-hidden>
        “
      </span>
      <p
        id={textId}
        className={long && !expanded ? 'quote__text quote__text--collapsed' : 'quote__text'}
      >
        {review.quote}
      </p>
      {long && (
        <button
          type="button"
          className="quote__expand"
          aria-controls={textId}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Read full comment'}
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

export function Testimonials({ reviews }: { reviews: FeedbackCard[] }) {
  const [audience, setAudience] = useState('all')
  const [limit, setLimit] = useState(3)
  const gridId = useId()
  const grid = useRef<HTMLDivElement>(null)
  const nextFocus = useRef<number | undefined>(undefined)
  const filtered =
    audience === 'all' ? reviews : reviews.filter((review) => review.audience === audience)
  const shown = filtered.slice(0, limit)
  const filters = feedbackAudiences.filter((kind) =>
    reviews.some((review) => review.audience === kind.value),
  )

  useEffect(() => {
    if (nextFocus.current === undefined) return
    const quote = grid.current?.querySelector<HTMLElement>(
      `[data-review-id="${nextFocus.current}"]`,
    )
    quote?.focus({ preventScroll: true })
    quote?.scrollIntoView({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
    nextFocus.current = undefined
  }, [limit])

  return (
    <div className="love__collection">
      {filters.length > 1 && (
        <div className="chips love__filters" role="group" aria-label="Filter feedback">
          {[{ value: 'all', label: 'All feedback' }, ...filters].map((kind) => (
            <button
              key={kind.value}
              type="button"
              className={`chip${audience === kind.value ? ' is-active' : ''}`}
              aria-pressed={audience === kind.value}
              aria-controls={gridId}
              onClick={() => {
                setAudience(kind.value)
                setLimit(3)
              }}
            >
              {kind.label}
            </button>
          ))}
        </div>
      )}
      <div id={gridId} ref={grid} className="love__grid" data-reveal-group>
        {shown.map((review) => (
          <Quote key={review.id} review={review} />
        ))}
      </div>
      {reviews.length > 3 && (
        <div className="love__more">
          <p role="status" aria-live="polite">
            Showing {shown.length} of {filtered.length} comments
          </p>
          {shown.length < filtered.length && (
            <button
              type="button"
              className="btn btn--ghost"
              aria-controls={gridId}
              onClick={() => {
                nextFocus.current = filtered[limit]?.id
                setLimit(limit + 6)
              }}
            >
              Read more feedback
              <svg
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden
              >
                <path d="M8 3v10M3 8l5 5 5-5" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
