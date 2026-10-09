import React from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeroFilms } from '@/components/site/HeroFilms'
import { heroFilms } from '@/lib/hero-media'

class VisibilityObserver {
  static current: VisibilityObserver
  targets = new Set<Element>()
  constructor(private callback: IntersectionObserverCallback) {
    VisibilityObserver.current = this
  }
  observe = (element: Element) => this.targets.add(element)
  disconnect = () => this.targets.clear()
  enter(visible: boolean) {
    this.callback(
      [{ isIntersecting: visible } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

const motion = Object.assign(new EventTarget(), { matches: false })
const phone = Object.assign(new EventTarget(), { matches: false })
const films = heroFilms('https://example.com/hero-loop.mp4')
let play: ReturnType<typeof vi.spyOn>
let pause: ReturnType<typeof vi.spyOn>

const mount = () => render(React.createElement(HeroFilms, { films }))
const video = (container: HTMLElement, index: number) =>
  container.querySelector<HTMLVideoElement>(`video[data-film-index="${index}"]`)!
const active = (container: HTMLElement) =>
  container.querySelector('[data-active-film]')?.getAttribute('data-active-film')
const decode = async (element: HTMLVideoElement) => {
  await act(async () => {
    fireEvent.loadedData(element)
  })
}

beforeEach(() => {
  motion.matches = false
  phone.matches = false
  vi.stubGlobal('IntersectionObserver', VisibilityObserver)
  vi.stubGlobal('matchMedia', (query: string) =>
    query.includes('prefers-reduced-motion') ? motion : phone,
  )
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('the curated hero films', () => {
  it('lets the CMS start with a poster and allows a visitor to press Play', () => {
    const view = render(React.createElement(HeroFilms, { films, autoPlay: false }))
    act(() => VisibilityObserver.current.enter(true))
    expect(play).not.toHaveBeenCalled()
    expect(view.getByRole('button', { name: 'Play hero films' })).toBeTruthy()
    fireEvent.click(view.getByRole('button', { name: 'Play hero films' }))
    expect(play).toHaveBeenCalled()
  })

  it('loads only the opening film before another is requested', () => {
    const view = mount()
    expect(view.container.querySelectorAll('video')).toHaveLength(1)
    expect(video(view.container, 0).getAttribute('src')).toBe('/media/hero-quality-v1.mp4')
    expect(play).not.toHaveBeenCalled()
    act(() => VisibilityObserver.current.enter(true))
    expect(play).toHaveBeenCalled()
  })

  it('holds the visible film until the selection decodes, then releases the old decoder', async () => {
    vi.useFakeTimers()
    const view = mount()
    act(() => VisibilityObserver.current.enter(true))
    fireEvent.click(view.getByRole('button', { name: 'Show sangeet film' }))
    expect(active(view.container)).toBe('wedding')
    expect(view.container.querySelectorAll('video')).toHaveLength(2)
    await decode(video(view.container, 1))
    expect(active(view.container)).toBe('sangeet')
    expect(
      view.getByRole('button', { name: 'Show sangeet film' }).getAttribute('aria-pressed'),
    ).toBe('true')
    act(() => vi.advanceTimersByTime(700))
    expect(view.container.querySelectorAll('video')).toHaveLength(1)
    expect(video(view.container, 1)).toBeTruthy()
  })

  it('ignores a late frame from a superseded selection', async () => {
    let finish: () => void
    const waiting = new Promise<void>((resolve) => {
      finish = resolve
    })
    play.mockImplementation(function (this: HTMLMediaElement) {
      return this.src.includes('sangeet') ? waiting : Promise.resolve()
    })
    const view = mount()
    act(() => VisibilityObserver.current.enter(true))
    fireEvent.click(view.getByRole('button', { name: 'Show sangeet film' }))
    const superseded = video(view.container, 1)
    fireEvent.loadedData(superseded)
    fireEvent.click(view.getByRole('button', { name: 'Show games film' }))
    await act(async () => finish!())
    expect(active(view.container)).toBe('wedding')
    await decode(video(view.container, 3))
    expect(active(view.container)).toBe('games')
  })

  it('resumes after visibility interrupts an incoming film', async () => {
    let interrupt: (reason: unknown) => void
    const waiting = new Promise<void>((_, reject) => {
      interrupt = reject
    })
    play.mockImplementation(function (this: HTMLMediaElement) {
      return this.src.includes('sangeet') ? waiting : Promise.resolve()
    })
    const view = mount()
    act(() => VisibilityObserver.current.enter(true))
    fireEvent.click(view.getByRole('button', { name: 'Show sangeet film' }))
    fireEvent.loadedData(video(view.container, 1))
    act(() => VisibilityObserver.current.enter(false))
    await act(async () => interrupt!(new DOMException('Playback paused', 'AbortError')))
    expect(view.getByRole('button', { name: 'Pause hero films' })).toBeTruthy()
    play.mockClear()
    act(() => VisibilityObserver.current.enter(true))
    expect(play).toHaveBeenCalled()
  })

  it('advances automatically while visible and pauses when scrolled away or hidden', async () => {
    const view = mount()
    act(() => VisibilityObserver.current.enter(true))
    fireEvent.ended(video(view.container, 0))
    await decode(video(view.container, 1))
    expect(active(view.container)).toBe('sangeet')
    pause.mockClear()
    act(() => VisibilityObserver.current.enter(false))
    expect(pause).toHaveBeenCalled()
    play.mockClear()
    fireEvent.ended(video(view.container, 1))
    expect(view.container.querySelector('video[data-film-index="2"]')).toBeNull()
    expect(play).not.toHaveBeenCalled()
    act(() => VisibilityObserver.current.enter(true))
    expect(play).toHaveBeenCalled()
    pause.mockClear()
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(pause).toHaveBeenCalled()
  })

  it('keeps a paused film and a focused selector from rotating', () => {
    const view = mount()
    act(() => VisibilityObserver.current.enter(true))
    fireEvent.click(view.getByRole('button', { name: 'Pause hero films' }))
    fireEvent.ended(video(view.container, 0))
    expect(view.container.querySelectorAll('video')).toHaveLength(1)
    expect(view.getByRole('button', { name: 'Play hero films' })).toBeTruthy()
    fireEvent.click(view.getByRole('button', { name: 'Play hero films' }))
    fireEvent.focus(view.getByRole('button', { name: 'Show wedding film' }))
    fireEvent.ended(video(view.container, 0))
    expect(view.container.querySelectorAll('video')).toHaveLength(1)
  })

  it('respects reduced motion at arrival and when the preference changes', () => {
    motion.matches = true
    const view = mount()
    act(() => VisibilityObserver.current.enter(true))
    expect(play).not.toHaveBeenCalled()
    expect(view.getByRole('button', { name: 'Play hero films' })).toBeTruthy()
    fireEvent.click(view.getByRole('button', { name: 'Play hero films' }))
    expect(play).toHaveBeenCalled()
    pause.mockClear()
    act(() => motion.dispatchEvent(new Event('change')))
    expect(pause).toHaveBeenCalled()
    expect(view.getByRole('button', { name: 'Play hero films' })).toBeTruthy()
  })

  it('uses the portrait export and matching poster on a phone', async () => {
    phone.matches = true
    const view = mount()
    fireEvent.click(view.getByRole('button', { name: 'Show games film' }))
    expect(video(view.container, 3).getAttribute('src')).toBe('/media/hero-games-mobile-v1.mp4')
    expect(video(view.container, 3).getAttribute('poster')).toBe(
      '/media/hero-games-mobile-v1-poster.jpg',
    )
    await decode(video(view.container, 3))
    expect(active(view.container)).toBe('games')
  })

  it('holds the current film on a loading error and allows another selection', async () => {
    const view = mount()
    fireEvent.click(view.getByRole('button', { name: 'Show games film' }))
    fireEvent.error(video(view.container, 3))
    expect(active(view.container)).toBe('wedding')
    expect(view.getByRole('status').textContent).toContain('Film unavailable')
    fireEvent.click(view.getByRole('button', { name: 'Show haldi film' }))
    await decode(video(view.container, 2))
    expect(active(view.container)).toBe('haldi')
    expect(view.queryByRole('status')).toBeNull()
  })

  it('bounds a stalled load and cleans up deadlines and observers on exit', () => {
    vi.useFakeTimers()
    const view = mount()
    fireEvent.click(view.getByRole('button', { name: 'Show sangeet film' }))
    act(() => vi.advanceTimersByTime(8000))
    expect(active(view.container)).toBe('wedding')
    expect(view.getByRole('status')).toBeTruthy()
    fireEvent.click(view.getByRole('button', { name: 'Show games film' }))
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
    expect(VisibilityObserver.current.targets.size).toBe(0)
  })

  it('keeps a custom CMS video and a poster-only hero independent of the curated lineup', () => {
    expect(heroFilms('https://example.com/new-film.mp4', '/custom.jpg')).toEqual([
      {
        id: 'custom',
        label: 'Highlights',
        src: 'https://example.com/new-film.mp4',
        poster: '/custom.jpg',
      },
    ])
    const view = render(
      React.createElement(HeroFilms, { films: heroFilms(undefined, '/still.jpg') }, 'Site content'),
    )
    expect(view.container.querySelector('img')?.getAttribute('src')).toBe('/still.jpg')
    expect(view.container.textContent).toBe('Site content')
    expect(view.queryByRole('group')).toBeNull()
  })
})
