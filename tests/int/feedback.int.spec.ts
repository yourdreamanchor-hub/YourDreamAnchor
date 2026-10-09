import React from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Testimonials, type FeedbackCard } from '@/components/site/Testimonials'
import { feedbackSource } from '@/lib/feedback'
import collectedFeedback from '@/content/social-feedback.json'

const reviews = collectedFeedback.map((review, index) => ({
  ...review,
  id: index + 1,
})) as FeedbackCard[]
const scrollIntoView = vi.fn()

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  })
})
afterEach(() => {
  cleanup()
  scrollIntoView.mockClear()
  vi.unstubAllGlobals()
})

describe('original social feedback', () => {
  it('keeps unique source IDs and valid original links for every selected comment', () => {
    expect(new Set(collectedFeedback.map((review) => review.sourceId)).size).toBe(59)
    for (const review of collectedFeedback) {
      expect(feedbackSource(review.sourceUrl, review.sourcePlatform)).toBe(review.sourceUrl)
      expect(review.quote.trim()).not.toBe('')
      expect(review.sourceHandle).toMatch(/^@/)
      expect(review.sourceId).toMatch(new RegExp(`^${review.sourcePlatform}:`))
    }
  })

  it('rejects scripts, deceptive platform hosts, credentials and insecure links', () => {
    for (const url of [
      'javascript:alert(1)',
      'http://instagram.com/p/example',
      'https://instagram.com.attacker.example/p/example',
      'https://instagram.com@attacker.example/p/example',
      'https://attacker@instagram.com/p/example',
      'https://instagram.com:444/p/example',
      'https://www.youtube.com/watch?v=TzoFugiu4Go',
    ])
      expect(feedbackSource(url, 'instagram')).toBeUndefined()
    expect(feedbackSource('https://instagram.com/p/example', 'youtube')).toBeUndefined()
    expect(feedbackSource('https://example.com/feedback', 'other')).toBe(
      'https://example.com/feedback',
    )
  })
})

describe('feedback browsing', () => {
  it('opens with the three couple comments, exact wording and original source links', () => {
    const view = render(React.createElement(Testimonials, { reviews }))
    expect(view.container.querySelectorAll('blockquote')).toHaveLength(3)
    expect(view.getByRole('status').textContent).toBe('Showing 3 of 59 comments')
    for (const review of reviews.slice(0, 3)) {
      const quote = view.container.querySelector(`[data-review-id="${review.id}"]`)!
      expect(quote.querySelector('p')?.textContent).toBe(review.quote)
      expect(quote.querySelector('a')?.getAttribute('href')).toBe(review.sourceUrl)
    }
    expect(view.container.querySelector('iframe')).toBeNull()
  })

  it('reveals all feedback beyond twelve entries and focuses the first newly revealed comment', () => {
    const view = render(React.createElement(Testimonials, { reviews }))
    fireEvent.click(view.getByRole('button', { name: 'Read more feedback' }))
    expect(view.getByRole('status').textContent).toBe('Showing 9 of 59 comments')
    expect(document.activeElement?.getAttribute('data-review-id')).toBe('4')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'instant' })
    while (view.queryByRole('button', { name: 'Read more feedback' }))
      fireEvent.click(view.getByRole('button', { name: 'Read more feedback' }))
    expect(view.container.querySelectorAll('blockquote')).toHaveLength(59)
    expect(view.getByRole('status').textContent).toBe('Showing 59 of 59 comments')
  })

  it('filters collaborators and community separately, resetting the visible count', () => {
    const view = render(React.createElement(Testimonials, { reviews }))
    fireEvent.click(view.getByRole('button', { name: 'Read more feedback' }))
    fireEvent.click(view.getByRole('button', { name: /^Collaborators$/ }))
    expect(view.getByRole('status').textContent).toBe('Showing 3 of 7 comments')
    const shownIds = [...view.container.querySelectorAll('blockquote')].map((quote) =>
      Number(quote.getAttribute('data-review-id')),
    )
    expect(
      shownIds.every((id) => reviews.find((review) => review.id === id)?.audience === 'industry'),
    ).toBe(true)
    fireEvent.click(view.getByRole('button', { name: /^Community$/ }))
    expect(view.getByRole('status').textContent).toBe('Showing 3 of 39 comments')
    expect(view.getByRole('button', { name: /^Community$/ }).getAttribute('aria-pressed')).toBe(
      'true',
    )
    fireEvent.click(view.getByRole('button', { name: 'All feedback' }))
    expect(view.getByRole('status').textContent).toBe('Showing 3 of 59 comments')
  })

  it('expands a long quote without rewriting it or removing its source', () => {
    const review = reviews.find((entry) => entry.quote.length > 300)!
    expect(review).toBeTruthy()
    const view = render(React.createElement(Testimonials, { reviews: [review] }))
    const button = view.getByRole('button', { name: 'Read full comment' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(button)
    expect(view.getByRole('button', { name: 'Show less' }).getAttribute('aria-expanded')).toBe(
      'true',
    )
    expect(view.container.querySelector('p')?.textContent).toBe(review.quote)
    expect(view.container.querySelector('.quote__text--collapsed')).toBeNull()
    expect(view.container.querySelector('a')?.getAttribute('href')).toBe(review.sourceUrl)
  })
})
