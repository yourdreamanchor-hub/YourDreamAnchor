import React from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Testimonials, type FeedbackCard } from '@/components/site/Testimonials'
import { feedbackSource } from '@/lib/feedback'
import collectedFeedback from '@/content/social-feedback.json'

const reviews = collectedFeedback.map((review, index) => ({
  ...review,
  id: index + 1,
})) as FeedbackCard[]
const scrollIntoView = vi.fn()
const media = new Map<
  string,
  {
    matches: boolean
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
    listeners: Set<() => void>
  }
>()
const intersections: {
  callback: (entries: { isIntersecting: boolean }[]) => void
  disconnect: ReturnType<typeof vi.fn>
}[] = []
const resizes: { disconnect: ReturnType<typeof vi.fn> }[] = []

function query(name: string) {
  if (!media.has(name)) {
    const listeners = new Set<() => void>()
    media.set(name, {
      matches: false,
      listeners,
      addEventListener: vi.fn((_, listener) => listeners.add(listener)),
      removeEventListener: vi.fn((_, listener) => listeners.delete(listener)),
    })
  }
  return media.get(name)!
}

function changeMedia(name: string, matches: boolean) {
  act(() => {
    const item = query(name)
    item.matches = matches
    item.listeners.forEach((listener) => listener())
  })
}

beforeEach(() => {
  media.clear()
  intersections.length = 0
  resizes.length = 0
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  vi.stubGlobal('matchMedia', query)
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      disconnect = vi.fn()
      constructor(public callback: (entries: { isIntersecting: boolean }[]) => void) {
        intersections.push(this)
      }
      observe() {
        this.callback([{ isIntersecting: true }])
      }
    },
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect = vi.fn()
      observe = vi.fn()
      constructor() {
        resizes.push(this)
      }
    },
  )
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      pointerType: string
      constructor(type: string, options: PointerEventInit) {
        super(type, options)
        this.pointerType = options.pointerType || 'mouse'
      }
    },
  )
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  })
})
afterEach(() => {
  cleanup()
  scrollIntoView.mockClear()
  vi.restoreAllMocks()
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
  it('includes every published comment in the wall with exact wording and original source links', () => {
    const view = render(React.createElement(Testimonials, { reviews }))
    expect(view.container.querySelectorAll('[data-review-id]')).toHaveLength(59)
    expect(view.getByRole('status').textContent).toBe('59 comments')
    expect(view.container.querySelector('.love__wall')?.getAttribute('data-moving')).toBe('true')
    for (const review of reviews) {
      const quote = view.container.querySelector(`[data-review-id="${review.id}"]`)!
      expect(quote.querySelector('p')?.textContent).toBe(review.quote)
      expect(quote.querySelector('a')?.getAttribute('href')).toBe(review.sourceUrl)
    }
    expect(view.container.querySelector('iframe')).toBeNull()
  })

  it('keeps loop copies out of the accessibility tree and keyboard tab order', () => {
    const view = render(React.createElement(Testimonials, { reviews }))
    const copies = view.container.querySelectorAll('.love__group--copy')
    expect(copies).toHaveLength(3)
    for (const copy of copies) {
      expect(copy.getAttribute('aria-hidden')).toBe('true')
      expect(copy.querySelector('[data-review-id]')).toBeNull()
      for (const control of copy.querySelectorAll('a, button'))
        expect(control.getAttribute('tabindex')).toBe('-1')
    }
  })

  it('opens the entire still collection and returns to the floating view', () => {
    const view = render(React.createElement(Testimonials, { reviews }))
    fireEvent.click(view.getByRole('button', { name: 'Read all 59' }))
    expect(view.container.querySelector('.love__wall')?.getAttribute('data-view')).toBe('all')
    expect(view.container.querySelectorAll('blockquote')).toHaveLength(59)
    expect(view.queryByRole('button', { name: 'Pause' })).toBeNull()
    fireEvent.click(view.getByRole('button', { name: 'Back to floating view' }))
    expect(view.container.querySelector('.love__wall')?.getAttribute('data-view')).toBe('floating')
    expect(view.container.querySelectorAll('[data-review-id]')).toHaveLength(59)
    expect(view.container.querySelectorAll('.love__group--copy')).toHaveLength(3)
  })

  it('pauses on hover and remembers an explicit pause after the pointer leaves', () => {
    const view = render(React.createElement(Testimonials, { reviews }))
    const wall = view.container.querySelector('.love__wall')!
    fireEvent.pointerEnter(wall, { pointerType: 'mouse' })
    expect(wall.getAttribute('data-moving')).toBe('false')
    fireEvent.pointerLeave(wall, { pointerType: 'mouse' })
    expect(wall.getAttribute('data-moving')).toBe('true')
    fireEvent.click(view.getByRole('button', { name: 'Pause' }))
    expect(view.getByRole('button', { name: 'Resume' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.pointerEnter(wall, { pointerType: 'mouse' })
    fireEvent.pointerLeave(wall, { pointerType: 'mouse' })
    expect(wall.getAttribute('data-moving')).toBe('false')
    fireEvent.click(view.getByRole('button', { name: 'Resume' }))
    expect(wall.getAttribute('data-moving')).toBe('true')
  })

  it('stops after a touch so a mobile visitor can read without chasing a card', () => {
    const view = render(React.createElement(Testimonials, { reviews }))
    const wall = view.container.querySelector('.love__wall')!
    fireEvent.pointerDown(wall, { pointerType: 'touch' })
    fireEvent.pointerEnter(wall, { pointerType: 'touch' })
    fireEvent.pointerLeave(wall, { pointerType: 'touch' })
    expect(wall.getAttribute('data-moving')).toBe('false')
    expect(view.getByRole('button', { name: 'Resume' })).toBeTruthy()
  })

  it('stops off screen and in a hidden tab, and releases its observers and listeners', () => {
    const view = render(React.createElement(Testimonials, { reviews }))
    const wall = view.container.querySelector('.love__wall')!
    act(() => intersections[0].callback([{ isIntersecting: false }]))
    expect(wall.getAttribute('data-moving')).toBe('false')
    act(() => intersections[0].callback([{ isIntersecting: true }]))
    expect(wall.getAttribute('data-moving')).toBe('true')
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    fireEvent(document, new Event('visibilitychange'))
    expect(wall.getAttribute('data-moving')).toBe('false')
    view.unmount()
    expect(intersections[0].disconnect).toHaveBeenCalledOnce()
    expect(resizes[0].disconnect).toHaveBeenCalledOnce()
    for (const item of media.values()) expect(item.listeners.size).toBe(0)
  })

  it('filters the complete collection and shows short selections without a sparse loop', () => {
    const view = render(React.createElement(Testimonials, { reviews }))
    fireEvent.click(view.getByRole('button', { name: /^Collaborators$/ }))
    expect(view.getByRole('status').textContent).toBe('7 comments')
    expect(view.container.querySelector('.love__wall')?.getAttribute('data-view')).toBe('all')
    expect(view.container.querySelectorAll('blockquote')).toHaveLength(7)
    const shownIds = [...view.container.querySelectorAll('[data-review-id]')].map((quote) =>
      Number(quote.getAttribute('data-review-id')),
    )
    expect(
      shownIds.every((id) => reviews.find((review) => review.id === id)?.audience === 'industry'),
    ).toBe(true)
    fireEvent.click(view.getByRole('button', { name: /^Community$/ }))
    expect(view.getByRole('status').textContent).toBe('39 comments')
    expect(view.container.querySelectorAll('[data-review-id]')).toHaveLength(39)
    expect(view.getByRole('button', { name: /^Community$/ }).getAttribute('aria-pressed')).toBe(
      'true',
    )
    fireEvent.click(view.getByRole('button', { name: 'All feedback' }))
    expect(view.getByRole('status').textContent).toBe('59 comments')
    expect(view.container.querySelectorAll('[data-review-id]')).toHaveLength(59)
  })

  it('shows all comments still when reduced motion or the CMS motion setting is off', () => {
    query('(prefers-reduced-motion: reduce)').matches = true
    const view = render(React.createElement(Testimonials, { reviews }))
    expect(view.container.querySelector('.love__wall')?.getAttribute('data-view')).toBe('all')
    expect(view.container.querySelectorAll('blockquote')).toHaveLength(59)
    expect(view.queryByRole('button', { name: 'Pause' })).toBeNull()
    changeMedia('(prefers-reduced-motion: reduce)', false)
    expect(view.container.querySelector('.love__wall')?.getAttribute('data-view')).toBe('floating')
    view.rerender(React.createElement(Testimonials, { reviews, motionEnabled: false }))
    expect(view.container.querySelector('.love__wall')?.getAttribute('data-view')).toBe('all')
    expect(view.container.querySelectorAll('blockquote')).toHaveLength(59)
    expect(view.container.querySelector('.love__wall')?.getAttribute('data-moving')).toBe('false')
  })

  it('keeps the full collection when switching between phone, tablet and desktop columns', () => {
    query('(max-width: 600px)').matches = true
    const view = render(React.createElement(Testimonials, { reviews }))
    expect(view.container.querySelectorAll('.love__column')).toHaveLength(1)
    expect(view.container.querySelectorAll('[data-review-id]')).toHaveLength(59)
    query('(max-width: 950px)').matches = true
    changeMedia('(max-width: 600px)', false)
    expect(view.container.querySelectorAll('.love__column')).toHaveLength(2)
    expect(view.container.querySelectorAll('[data-review-id]')).toHaveLength(59)
    changeMedia('(max-width: 950px)', false)
    expect(view.container.querySelectorAll('.love__column')).toHaveLength(3)
    expect(view.container.querySelectorAll('[data-review-id]')).toHaveLength(59)
  })

  it('gives keyboard focus an unclipped still view and preserves the selected source link', () => {
    const view = render(React.createElement(Testimonials, { reviews }))
    const source = view.container.querySelector<HTMLElement>('[data-review-id="1"] a')!
    fireEvent.keyDown(document, { key: 'Tab' })
    act(() => source.focus())
    expect(view.container.querySelector('.love__wall')?.getAttribute('data-view')).toBe('all')
    expect(document.activeElement).toBe(source)
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'instant' })
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
    expect(view.container.querySelector('.quote p')?.textContent).toBe(review.quote)
    expect(view.container.querySelector('.quote__text--collapsed')).toBeNull()
    expect(view.container.querySelector('a')?.getAttribute('href')).toBe(review.sourceUrl)
  })

  it('preserves keyboard focus on the full-comment control when entering the still layout', () => {
    const review = reviews.find((entry) => entry.quote.length > 300)!
    const view = render(React.createElement(Testimonials, { reviews }))
    const button = view.container.querySelector<HTMLElement>(
      `[data-review-id="${review.id}"] button`,
    )!
    fireEvent.keyDown(document, { key: 'Tab' })
    act(() => button.focus())
    expect(view.container.querySelector('.love__wall')?.getAttribute('data-view')).toBe('all')
    expect(document.activeElement).toBe(button)
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
  })

  it('opens a long floating comment fully with focus on its original card', () => {
    const review = reviews.find((entry) => entry.quote.length > 300)!
    const view = render(React.createElement(Testimonials, { reviews }))
    const quote = view.container.querySelector(`[data-review-id="${review.id}"]`)!
    fireEvent.click(quote.querySelector('button')!)
    expect(view.container.querySelector('.love__wall')?.getAttribute('data-view')).toBe('all')
    expect(quote.querySelector('.quote__text--collapsed')).toBeNull()
    expect(quote.querySelector('p')?.textContent).toBe(review.quote)
    expect(document.activeElement?.getAttribute('data-review-id')).toBe(String(review.id))
  })
})
