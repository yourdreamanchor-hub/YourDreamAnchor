import React from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Moments, type ReelCard } from '@/components/site/Moments'
import { youtubeVideo, youtubeVideoId } from '@/lib/youtube'

const id = 'zR7TZuHqzy8'
const reels: ReelCard[] = [
  {
    id: 1,
    title: 'Harshita & Shrey',
    category: 'haldi',
    categoryLabel: 'Haldi',
    mediaSource: 'youtube',
    youtubeUrl: `https://youtu.be/${id}`,
    orientation: 'portrait',
  },
  {
    id: 2,
    title: 'Tarika & Dhruv',
    category: 'wedding',
    categoryLabel: 'Wedding',
    mediaSource: 'youtube',
    youtubeUrl: 'https://www.youtube.com/watch?v=TzoFugiu4Go',
    orientation: 'landscape',
  },
  {
    id: 3,
    title: 'Uploaded haldi',
    category: 'haldi',
    categoryLabel: 'Haldi',
    video: '/haldi.mp4',
    poster: '/haldi.jpg',
    orientation: 'portrait',
  },
]

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => Object.assign(new EventTarget(), { matches: false }))
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false
    },
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('YouTube links', () => {
  it('accepts watch, short, share, live and embed links with an exact video ID', () => {
    for (const url of [
      `https://www.youtube.com/watch?v=${id}&list=PLexample`,
      `https://m.youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}?si=share`,
      `https://youtube.com/shorts/${id}`,
      `https://www.youtube.com/live/${id}`,
      `https://www.youtube-nocookie.com/embed/${id}`,
    ])
      expect(youtubeVideoId(url)).toBe(id)
  })

  it('rejects foreign hosts, credentials, script URLs, channel URLs and malformed IDs', () => {
    for (const url of [
      `https://youtube.com.attacker.example/watch?v=${id}`,
      `https://youtube.com@attacker.example/watch?v=${id}`,
      `https://attacker@youtube.com/watch?v=${id}`,
      `javascript:alert('${id}')`,
      `http://www.youtube.com/watch?v=${id}`,
      'https://www.youtube.com/@akshaytakalkarr',
      'https://www.youtube.com/watch?v=bad',
      `https://youtu.be/${id}/another`,
      `https://www.youtube.com:444/watch?v=${id}`,
      '',
    ])
      expect(youtubeVideoId(url)).toBeUndefined()
  })
})

describe('YouTube films in Moments', () => {
  it('loads no iframe on entry or hover, then opens the selected original film on click', () => {
    const view = render(
      React.createElement(Moments, {
        reels,
        youtubeChannel: 'https://www.youtube.com/@akshaytakalkarr',
      }),
    )
    const opener = view.getByRole('button', { name: 'Play: Harshita & Shrey' })
    fireEvent.mouseEnter(opener)
    expect(view.container.querySelector('iframe')).toBeNull()
    expect(view.getByRole('link', { name: /More on YouTube/ }).getAttribute('href')).toBe(
      'https://www.youtube.com/@akshaytakalkarr',
    )
    fireEvent.click(opener)
    const player = view.container.querySelector('iframe')!
    expect(player.src).toBe(youtubeVideo(reels[0].youtubeUrl)!.embedUrl)
    expect(player.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin')
    expect(player.title).toBe('Harshita & Shrey')
    expect(view.getByRole('link', { name: /Watch on YouTube/ }).getAttribute('href')).toBe(
      `https://www.youtube.com/watch?v=${id}`,
    )
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(view.getByRole('button', { name: 'Close video' }))
    expect(view.container.querySelector('iframe')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(opener)
  })

  it('removes each previous player when stepping between portrait, landscape and uploaded films', () => {
    const view = render(React.createElement(Moments, { reels }))
    fireEvent.click(view.getByRole('button', { name: 'Play: Harshita & Shrey' }))
    const previous = view.container.querySelector('iframe')!
    fireEvent.click(view.getByRole('button', { name: 'Next video' }))
    expect(previous.isConnected).toBe(false)
    expect(view.container.querySelector('iframe')!.src).toContain('TzoFugiu4Go')
    expect(view.container.querySelector('dialog')!.classList.contains('lightbox--landscape')).toBe(
      true,
    )
    fireEvent.click(view.getByRole('button', { name: 'Next video' }))
    expect(view.container.querySelector('iframe')).toBeNull()
    expect(view.container.querySelector('dialog video')!.getAttribute('src')).toBe('/haldi.mp4')
    fireEvent(view.container.querySelector('dialog')!, new Event('cancel', { cancelable: true }))
    expect(view.container.querySelector('dialog video')).toBeNull()
  })

  it('filters both sources and retains the correct selected film after filtering', () => {
    const view = render(React.createElement(Moments, { reels }))
    fireEvent.click(view.getByRole('button', { name: /^Haldi$/ }))
    expect(view.queryByRole('button', { name: 'Play: Tarika & Dhruv' })).toBeNull()
    fireEvent.click(view.getByRole('button', { name: 'Play: Uploaded haldi' }))
    expect(view.getByRole('heading', { name: 'Uploaded haldi' })).toBeTruthy()
    fireEvent.click(view.getByRole('button', { name: 'Previous video' }))
    expect(view.container.querySelector('iframe')!.src).toContain(id)
    fireEvent.click(view.getByRole('button', { name: 'Close video' }))
    fireEvent.click(view.getByRole('button', { name: /^All$/ }))
    expect(view.getByRole('button', { name: 'Play: Tarika & Dhruv' })).toBeTruthy()
  })

  it('uses a thumbnail fallback and excludes links that cannot be played safely', () => {
    const view = render(
      React.createElement(Moments, {
        reels: [
          ...reels,
          { ...reels[0], id: 4, title: 'Invalid link', youtubeUrl: 'https://example.com/video' },
        ],
      }),
    )
    expect(view.queryByRole('button', { name: 'Play: Invalid link' })).toBeNull()
    const cover = view.getByRole('button', { name: 'Play: Harshita & Shrey' }).querySelector('img')!
    fireEvent.error(cover)
    expect(cover.src).toBe(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)
  })

  it('also falls back when YouTube returns a tiny placeholder with a successful response', () => {
    const view = render(React.createElement(Moments, { reels }))
    const cover = view.getByRole('button', { name: 'Play: Harshita & Shrey' }).querySelector('img')!
    Object.defineProperty(cover, 'naturalWidth', { value: 120 })
    fireEvent.load(cover)
    expect(cover.src).toBe(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)
  })
})
