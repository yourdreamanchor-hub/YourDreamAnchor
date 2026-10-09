import { describe, expect, it } from 'vitest'
import type { Home, Media, SiteSetting } from '@/payload-types'
import { heroFilms } from '@/lib/hero-media'
import { gamesBackdrop, navigationLinks, selectedLogo } from '@/lib/site-content'
import { cmsOrigins, previewURL, siteOrigin } from '@/lib/site-origin'

const deployment = {
  NODE_ENV: 'production',
  VERCEL: '1',
  NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
  VERCEL_URL: 'yourdreamanchor-preview.vercel.app',
  VERCEL_PROJECT_PRODUCTION_URL: 'yourdreamanchor.vercel.app',
}
const media = (url: string) => ({ id: 1, url }) as Media

describe('live CMS origins', () => {
  it('repairs a development address on Vercel without trusting that development origin', () => {
    expect(siteOrigin(deployment)).toBe('https://yourdreamanchor.com')
    expect(cmsOrigins(deployment)).toContain('https://yourdreamanchor.com')
    expect(cmsOrigins(deployment)).not.toContain('http://localhost:3000')
    expect(siteOrigin({ ...deployment, VERCEL: undefined })).toBe('https://yourdreamanchor.com')
  })

  it('accepts exact deployment aliases and explicitly configured origins only', () => {
    const origins = cmsOrigins({
      ...deployment,
      PAYLOAD_ALLOWED_ORIGINS:
        'https://www.yourdreamanchor.com/, javascript:alert(1), https://user:secret@example.com',
    })
    expect(origins).toEqual([
      'https://yourdreamanchor.com',
      'https://yourdreamanchor.vercel.app',
      'https://yourdreamanchor-preview.vercel.app',
      'https://www.yourdreamanchor.com',
    ])
    expect(origins).not.toContain('https://yourdreamanchor.com.attacker.example')
  })

  it('keeps local development and a trusted admin preview on their own origins', () => {
    expect(siteOrigin({ NODE_ENV: 'development' })).toBe('http://localhost:3000')
    expect(previewURL('https://yourdreamanchor-preview.vercel.app/admin', deployment)).toBe(
      'https://yourdreamanchor-preview.vercel.app/',
    )
    expect(previewURL('https://untrusted.example/admin', deployment)).toBe(
      'https://yourdreamanchor.com/',
    )
    expect(previewURL(undefined, deployment)).toBe('https://yourdreamanchor.com/')
  })
})

describe('CMS-controlled hero films', () => {
  it('respects the editor order, labels and hidden rows', () => {
    const films = heroFilms(undefined, undefined, [
      { id: 'a', label: 'Party', source: 'games' },
      { id: 'b', label: 'Hidden wedding', source: 'wedding', enabled: false },
      { id: 'c', label: 'Colour', source: 'haldi' },
    ])
    expect(films.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'a', label: 'Party' },
      { id: 'c', label: 'Colour' },
    ])
    expect(films[0].mobileSrc).toBe('/media/hero-games-mobile-v1.mp4')
  })

  it('uses an uploaded film literally, including a legacy-looking filename', () => {
    const [film] = heroFilms(undefined, undefined, [
      {
        label: 'My film',
        source: 'upload',
        video: media('/uploads/hero-loop.mp4'),
        poster: media('/uploads/cover.jpg'),
        mobileVideo: media('/uploads/phone.mp4'),
        mobilePoster: media('/uploads/phone.jpg'),
      },
    ])
    expect(film).toMatchObject({
      label: 'My film',
      src: '/uploads/hero-loop.mp4',
      poster: '/uploads/cover.jpg',
      mobileSrc: '/uploads/phone.mp4',
      mobilePoster: '/uploads/phone.jpg',
    })
  })

  it('allows custom covers and phone crops for the approved films', () => {
    const [film] = heroFilms(undefined, undefined, [
      {
        label: 'Wedding',
        source: 'wedding',
        poster: media('/cover.jpg'),
        mobileVideo: media('/phone.mp4'),
        mobilePoster: media('/phone.jpg'),
      },
    ])
    expect(film).toMatchObject({
      src: '/media/hero-quality-v1.mp4',
      poster: '/cover.jpg',
      mobileSrc: '/phone.mp4',
      mobilePoster: '/phone.jpg',
    })
  })

  it('does not bring back bundled films when every row is deliberately removed or hidden', () => {
    expect(heroFilms('/old.mp4', '/still.jpg', [])).toEqual([
      { id: 'still', label: 'Highlights', poster: '/still.jpg' },
    ])
    expect(
      heroFilms('/old.mp4', '/still.jpg', [
        { label: 'Wedding', source: 'wedding', enabled: false },
      ]),
    ).toEqual([{ id: 'still', label: 'Highlights', poster: '/still.jpg' }])
  })
})

describe('site editor selections', () => {
  it('keeps header links in the configured order and hides links to absent sections', () => {
    const settings = {
      navigation: [
        { label: 'Talk to me', section: 'contact' },
        { label: 'Films', section: 'moments' },
        { label: 'Travel', section: 'destinations' },
      ],
    } as SiteSetting
    expect(navigationLinks(settings, new Set(['contact', 'moments']))).toEqual([
      { label: 'Talk to me', href: '#contact' },
      { label: 'Films', href: '#moments' },
    ])
    expect(
      navigationLinks({ navigation: [] } as unknown as SiteSetting, new Set(['about'])),
    ).toEqual([])
  })

  it('respects the chosen artwork or plain Games background', () => {
    expect(gamesBackdrop({ backgroundStyle: 'upload' } as Home['games'], '/own.jpg')).toBe(
      '/own.jpg',
    )
    expect(gamesBackdrop({ backgroundStyle: 'plain' } as Home['games'], '/own.jpg')).toBeUndefined()
    expect(gamesBackdrop({ backgroundStyle: 'celebration' } as Home['games'])).toBe(
      '/media/games-celebration-v1.webp',
    )
  })

  it('respects a replacement logo while retaining the original as the default', () => {
    expect(selectedLogo({ logoStyle: 'upload' } as SiteSetting, '/own.svg')).toBe('/own.svg')
    expect(selectedLogo({ logoStyle: 'monogram' } as SiteSetting, '/own.svg')).toBe(
      '/brand/anchor-monogram-v1.svg',
    )
  })
})
