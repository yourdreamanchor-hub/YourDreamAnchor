import React from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BgVideo } from '@/components/site/BgVideo'
import { BrandIntro } from '@/components/site/BrandIntro'
import { Nav } from '@/components/site/Nav'
import { Reveal } from '@/components/site/Reveal'
import { heroMedia } from '@/lib/hero-media'
import { brandLogo, monogramUrl } from '@/lib/brand'

class Observer {
  static instances: Observer[] = []
  targets = new Set<Element>()
  constructor(private callback: IntersectionObserverCallback) {
    Observer.instances.push(this)
  }
  observe = (target: Element) => this.targets.add(target)
  unobserve = (target: Element) => this.targets.delete(target)
  disconnect = () => this.targets.clear()
  enter(target: Element, visible = true) {
    if (!this.targets.has(target)) return
    this.callback(
      [
        {
          target,
          isIntersecting: visible,
          intersectionRatio: Number(visible),
          boundingClientRect: { top: 200, left: 0 },
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    )
  }
}

const preference = new EventTarget() as EventTarget & { matches: boolean }
const animations: { cancel: ReturnType<typeof vi.fn> }[] = []
let animate: ReturnType<typeof vi.fn>

beforeEach(() => {
  Observer.instances = []
  preference.matches = false
  animations.length = 0
  vi.stubGlobal('IntersectionObserver', Observer)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('matchMedia', (query: string) =>
    query.includes('prefers-reduced-motion')
      ? preference
      : { matches: false, addEventListener() {}, removeEventListener() {} },
  )
  animate = vi.fn(() => {
    const animation = { cancel: vi.fn() }
    animations.push(animation)
    return animation
  })
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    top: 2000,
    bottom: 2200,
    left: 0,
    right: 300,
    width: 300,
    height: 200,
    x: 0,
    y: 2000,
    toJSON() {},
  }))
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate })
  document.body.innerHTML =
    '<main id="top"><section class="hero"><video class="hero__video"></video></section><article data-reveal="card"><button>Play celebration</button></article><figure data-reveal="photo"><img alt="Celebration"></figure></main>'
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete (Element.prototype as Partial<Element>).animate
  document.body.innerHTML = ''
})

describe('the logo intro always gives control back to the visitor', () => {
  const props = { brand: 'Your Dream Anchor', logo: monogramUrl }

  it('finishes the draw before fading once the opening frame is ready', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    Object.defineProperty(document.querySelector('video'), 'readyState', { value: 2 })
    const view = render(React.createElement(BrandIntro, props))
    await act(async () => {})
    act(() => vi.advanceTimersByTime(999))
    expect(view.container.querySelector('.brand-intro')?.hasAttribute('data-leaving')).toBe(false)
    act(() => vi.advanceTimersByTime(1))
    expect(view.container.querySelector('.brand-intro')?.getAttribute('data-leaving')).toBe('true')
    act(() => vi.advanceTimersByTime(320))
    expect(view.container.childElementCount).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears within the time limit when the video never responds', () => {
    vi.useFakeTimers()
    const view = render(React.createElement(BrandIntro, props))
    act(() => vi.advanceTimersByTime(2320))
    expect(view.container.childElementCount).toBe(0)
    expect(document.body.style.overflow).toBe('')
  })

  it('treats a media error as ready and releases the intro instead of waiting', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    const view = render(React.createElement(BrandIntro, props))
    await act(async () => fireEvent.error(document.querySelector('video')!))
    act(() => vi.advanceTimersByTime(1320))
    expect(view.container.childElementCount).toBe(0)
  })

  it('bypasses the opening when reduced motion is enabled', () => {
    preference.matches = true
    const view = render(React.createElement(BrandIntro, props))
    expect(view.container.childElementCount).toBe(0)
  })

  it('immediately dismisses for keyboard input without stealing focus', () => {
    const button = document.querySelector('article button') as HTMLButtonElement
    button.focus()
    const view = render(React.createElement(BrandIntro, props))
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(view.container.childElementCount).toBe(0)
    expect(document.activeElement).toBe(button)
  })

  it('bypasses section links and restored scroll positions', () => {
    vi.stubGlobal('location', { hash: '#moments' })
    const linked = render(React.createElement(BrandIntro, props))
    expect(linked.container.childElementCount).toBe(0)
    linked.unmount()
    vi.stubGlobal('location', { hash: '' })
    vi.stubGlobal('scrollY', 500)
    const restored = render(React.createElement(BrandIntro, props))
    expect(restored.container.childElementCount).toBe(0)
  })

  it('releases its timers and media listeners when the page unmounts', () => {
    vi.useFakeTimers()
    const view = render(React.createElement(BrandIntro, props))
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('the wordmark and monogram share a stable header', () => {
  it('follows scroll in both directions while keeping the brand link available', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 0
    })
    vi.stubGlobal('scrollY', 0)
    const view = render(React.createElement(Nav, { brand: 'Your Dream Anchor' }))
    const wordmark = view.container.querySelector<HTMLElement>('.nav__wordmark')!
    const svg = view.container.querySelector<SVGSVGElement>('.nav__morph')!
    const letters = [...svg.querySelectorAll('path')]
    const initial = letters.map((path) => path.getAttribute('d'))
    expect(wordmark.textContent).toBe('YourDreamAnchor')
    expect(svg.style.display).toBe('block')
    expect(letters).toHaveLength(15)
    act(() => {
      vi.stubGlobal('scrollY', 220)
      fireEvent.scroll(window)
    })
    const forming = letters.map((path) => path.getAttribute('d'))
    expect(forming).not.toEqual(initial)
    act(() => {
      vi.stubGlobal('scrollY', 400)
      fireEvent.scroll(window)
    })
    const finished = letters.map((path) => path.getAttribute('d'))
    expect(finished).not.toEqual(forming)
    expect(finished.every((path) => path && !path.includes('NaN'))).toBe(true)
    act(() => {
      vi.stubGlobal('scrollY', 0)
      fireEvent.scroll(window)
    })
    expect(letters.map((path) => path.getAttribute('d'))).toEqual(initial)
    expect(view.getByRole('link', { name: 'Your Dream Anchor' }).getAttribute('href')).toBe('#top')
  })

  it('uses the new mark for the former avatar and respects a later logo selection', () => {
    expect(brandLogo('https://storage.example/logo-avatar-1.jpg')).toBe(monogramUrl)
    expect(brandLogo('https://storage.example/anchor-monogram-v1.svg')).toBe(monogramUrl)
    expect(brandLogo('/custom-brand.svg')).toBe('/custom-brand.svg')
  })
})

describe('the scroll treatment keeps the page available', () => {
  it('leaves every section visible when reduced motion is already enabled', () => {
    preference.matches = true
    render(React.createElement(Reveal))
    expect(document.querySelectorAll('.is-pending')).toHaveLength(0)
    expect(animate).not.toHaveBeenCalled()
  })

  it('reveals waiting content and cancels movement if the visitor changes their preference', () => {
    render(React.createElement(Reveal))
    const card = document.querySelector('article')!
    const photo = document.querySelector('figure')!
    expect(photo.classList.contains('is-pending')).toBe(true)
    act(() => Observer.instances[0].enter(card))
    expect(animations.length).toBeGreaterThan(0)
    act(() => {
      preference.matches = true
      preference.dispatchEvent(new Event('change'))
    })
    expect(document.querySelectorAll('.is-pending')).toHaveLength(0)
    animations.forEach((animation) => expect(animation.cancel).toHaveBeenCalled())
  })

  it('makes a focused control immediately available, without waiting for an entrance', () => {
    render(React.createElement(Reveal))
    const button = document.querySelector('article button') as HTMLButtonElement
    expect(button.closest('article')?.classList.contains('is-pending')).toBe(true)
    act(() => button.focus())
    expect(button.closest('article')?.classList.contains('is-pending')).toBe(false)
    expect(document.activeElement).toBe(button)
    expect(animate).not.toHaveBeenCalled()
  })

  it('clears hidden states, observers and in-flight effects when the page unmounts', () => {
    const view = render(React.createElement(Reveal))
    act(() => Observer.instances[0].enter(document.querySelector('article')!))
    expect(document.querySelectorAll('.is-pending')).toHaveLength(1)
    view.unmount()
    expect(document.querySelectorAll('.is-pending')).toHaveLength(0)
    Observer.instances.forEach((observer) => expect(observer.targets.size).toBe(0))
    animations.forEach((animation) => expect(animation.cancel).toHaveBeenCalled())
  })

  it('falls back to readable content when browser animation support is unavailable', () => {
    delete (Element.prototype as Partial<Element>).animate
    render(React.createElement(Reveal))
    expect(document.querySelectorAll('.is-pending')).toHaveLength(0)
  })
})

describe('background footage follows the visitor’s motion preference', () => {
  it('pauses on a live preference change and resumes only while visible', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const view = render(React.createElement(BgVideo, { src: '/film.mp4' }))
    const video = view.container.querySelector('video')!
    act(() => Observer.instances[0].enter(video))
    expect(play).toHaveBeenCalledTimes(1)
    act(() => {
      preference.matches = true
      preference.dispatchEvent(new Event('change'))
    })
    expect(pause).toHaveBeenCalledTimes(1)
    act(() => {
      preference.matches = false
      preference.dispatchEvent(new Event('change'))
    })
    expect(play).toHaveBeenCalledTimes(2)
    act(() => Observer.instances[0].enter(video, false))
    expect(pause).toHaveBeenCalledTimes(2)
    act(() => {
      preference.dispatchEvent(new Event('change'))
    })
    expect(play).toHaveBeenCalledTimes(2)
    view.unmount()
    expect(pause).toHaveBeenCalledTimes(4)
  })
})

describe('the phone menu returns control to the page', () => {
  it('closes with Escape, restores scrolling and returns keyboard focus to the menu button', () => {
    const view = render(React.createElement(Nav, { brand: 'Your Dream Anchor' }))
    const toggle = view.getByRole('button', { name: 'Open menu' })
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(toggle)
  })

  it('restores the existing scroll setting when an open menu unmounts', () => {
    document.body.style.overflow = 'auto'
    const view = render(React.createElement(Nav, { brand: 'Your Dream Anchor' }))
    fireEvent.click(view.getByRole('button', { name: 'Open menu' }))
    view.unmount()
    expect(document.body.style.overflow).toBe('auto')
    document.body.style.overflow = ''
  })

  it('keeps keyboard focus in the menu and restores the background’s previous interaction state', () => {
    const main = document.querySelector('main')!
    main.inert = false
    const footer = document.createElement('footer')
    footer.inert = true
    const chat = document.createElement('a')
    chat.className = 'wa-float'
    chat.inert = false
    document.body.append(footer, chat)
    const view = render(React.createElement(Nav, { brand: 'Your Dream Anchor' }))
    const toggle = view.getByRole('button', { name: 'Open menu' })
    const brand = view.getByRole('link', { name: 'Your Dream Anchor' })
    fireEvent.click(toggle)
    expect(document.activeElement).toBe(view.getByRole('link', { name: 'About' }))
    expect(main.inert).toBe(true)
    expect(chat.inert).toBe(true)
    act(() => toggle.focus())
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(brand)
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(toggle)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(main.inert).toBe(false)
    expect(chat.inert).toBe(false)
    expect(footer.inert).toBe(true)
  })

  it('closes after a section choice and focuses its heading without leaving a permanent tab stop', () => {
    const section = document.createElement('section')
    section.id = 'about'
    section.innerHTML = '<h2>Meet Akshay</h2>'
    document.querySelector('main')!.append(section)
    const view = render(React.createElement(Nav, { brand: 'Your Dream Anchor' }))
    const toggle = view.getByRole('button', { name: 'Open menu' })
    fireEvent.click(toggle)
    fireEvent.click(view.getByRole('link', { name: 'About' }))
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(section.querySelector('h2'))
    act(() => toggle.focus())
    expect(section.querySelector('h2')?.hasAttribute('tabindex')).toBe(false)
  })

  it('releases the page if the visitor resizes an open menu to desktop', () => {
    const desktop = new EventTarget() as EventTarget & { matches: boolean }
    desktop.matches = false
    vi.stubGlobal('matchMedia', () => desktop)
    const view = render(React.createElement(Nav, { brand: 'Your Dream Anchor' }))
    const toggle = view.getByRole('button', { name: 'Open menu' })
    fireEvent.click(toggle)
    act(() => {
      desktop.matches = true
      desktop.dispatchEvent(new Event('change'))
    })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(document.body.style.overflow).toBe('')
  })
})

describe('the approved hero film preserves future CMS edits', () => {
  it('uses the reviewed export and its matching poster for both original upload names', () => {
    for (const filename of ['hero-loop.mp4', 'hero-loop-1.mp4']) {
      expect(
        heroMedia(`https://storage.example/yourdreamanchor/${filename}?v=1`, '/old.jpg'),
      ).toEqual({ src: '/media/hero-quality-v1.mp4', poster: '/media/hero-quality-v1-poster.jpg' })
    }
  })

  it('keeps a newly selected CMS video and poster intact', () => {
    expect(heroMedia('/api/media/file/new-celebration.mp4', '/new-poster.jpg')).toEqual({
      src: '/api/media/file/new-celebration.mp4',
      poster: '/new-poster.jpg',
    })
  })

  it('keeps the image fallback when the editor removes the video', () => {
    expect(heroMedia(undefined, '/still.jpg')).toEqual({ src: undefined, poster: '/still.jpg' })
  })
})
