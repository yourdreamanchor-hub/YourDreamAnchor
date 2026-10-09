import { describe, expect, it } from 'vitest'
import type { Home, Media, SiteSetting } from '@/payload-types'
import { cityFromSlug, cityPath, isInCity } from '@/lib/locations'
import { responsiveImage } from '@/lib/media'
import {
  absolutePublicURL,
  businessGraph,
  canonicalURL,
  indexableEnvironment,
  latestModified,
  pageMetadata,
  serializeJsonLd,
} from '@/lib/seo'

const settings = {
  brandName: 'Your Dream Anchor',
  anchorName: 'Akshay R Takalkar',
  role: 'Wedding & Event Anchor',
  phone: '+91 87622 25685',
  instagram: 'https://www.instagram.com/yourdreamanchor/',
  youtube: 'https://www.youtube.com/@akshaytakalkarr',
  metaTitle: 'An editor’s search title',
  metaDescription: 'An editor’s search description',
  googleSiteVerification: ' verification_token ',
} as SiteSetting
const home = {
  services: [{ title: 'Sangeet nights', description: 'Family performances.' }],
} as Home

describe('search discovery and truthful metadata', () => {
  it('keeps every canonical on the public domain even with a localhost build URL', () => {
    expect(canonicalURL()).toBe('https://yourdreamanchor.com/')
    expect(pageMetadata(settings, { path: cityPath('mumbai') }).alternates?.canonical).toBe(
      'https://yourdreamanchor.com/wedding-anchor-mumbai',
    )
  })

  it('indexes production, while development and Vercel previews stay out of search', () => {
    expect(
      indexableEnvironment({
        NODE_ENV: 'production',
        NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
        VERCEL_ENV: 'production',
      }),
    ).toBe(true)
    expect(indexableEnvironment({ NODE_ENV: 'production', VERCEL_ENV: 'preview' })).toBe(false)
    expect(indexableEnvironment({ NODE_ENV: 'development' })).toBe(false)
  })

  it('uses the editor’s own titles, per-page social links and the verification token', () => {
    const metadata = pageMetadata(settings, {
      path: cityPath('bengaluru'),
      title: 'Bengaluru title',
      description: 'Bengaluru description',
    })
    expect(pageMetadata(settings).title).toBe(settings.metaTitle)
    expect(metadata.openGraph).toMatchObject({
      title: 'Bengaluru title',
      description: 'Bengaluru description',
      url: 'https://yourdreamanchor.com/wedding-anchor-bengaluru',
      locale: 'en_IN',
    })
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: 'Bengaluru title',
    })
    expect(metadata.verification?.google).toBe('verification_token')
  })

  it('keeps business identity consistent across the service, person and breadcrumb', () => {
    const graph = businessGraph(settings, home, { path: cityPath('mumbai'), city: 'Mumbai' })[
      '@graph'
    ]
    expect(graph.find((node) => node['@type'] === 'Service')).toMatchObject({
      areaServed: [{ '@type': 'City', name: 'Mumbai' }],
      provider: { '@id': 'https://yourdreamanchor.com/#organization' },
    })
    expect(graph.find((node) => node['@type'] === 'BreadcrumbList')).toMatchObject({
      itemListElement: [
        { position: 1, item: 'https://yourdreamanchor.com/' },
        { position: 2, item: 'https://yourdreamanchor.com/wedding-anchor-mumbai' },
      ],
    })
    const serialized = serializeJsonLd(graph)
    for (const invented of [
      'aggregateRating',
      'reviewRating',
      'streetAddress',
      'LocalBusiness',
      'VideoObject',
    ])
      expect(serialized).not.toContain(invented)
  })

  it('escapes script endings and rejects unsafe or credential-containing asset URLs', () => {
    const text = '</script><script>alert(1)</script>'
    expect(serializeJsonLd({ text })).not.toContain('</script>')
    expect(JSON.parse(serializeJsonLd({ text }))).toEqual({ text })
    expect(absolutePublicURL('/media/photo.jpg')).toBe(
      'https://yourdreamanchor.com/media/photo.jpg',
    )
    expect(absolutePublicURL('javascript:alert(1)')).toBeUndefined()
    expect(absolutePublicURL('https://user:password@example.com/photo.jpg')).toBeUndefined()
  })

  it('uses genuine update dates and handles missing or malformed values', () => {
    expect(
      latestModified(undefined, 'invalid', '2026-10-08T12:00:00Z', '2026-10-09T12:00:00Z'),
    ).toBe('2026-10-09T12:00:00Z')
    expect(latestModified(null, undefined, 'invalid')).toBeUndefined()
  })

  it('matches actual event locations and accepts the Bangalore name', () => {
    expect(cityFromSlug('wedding-anchor-mumbai')).toBe('mumbai')
    expect(cityFromSlug('wedding-anchor-delhi')).toBeUndefined()
    expect(isInCity('St. Regis, Mumbai', 'mumbai')).toBe(true)
    expect(isInCity('Le Méridien, Dehradun', 'mumbai')).toBe(false)
    expect(isInCity('Shoonya Farm Retreat, Bangalore', 'bengaluru')).toBe(true)
    expect(isInCity(null, 'bengaluru')).toBe(false)
  })

  it('offers real photo sizes in width order without duplicate candidates or broken fallbacks', () => {
    const image = {
      url: '/photo.jpg',
      width: 1920,
      height: 1280,
      sizes: {
        thumb: { url: '/photo-480.jpg', width: 480 },
        card: { url: '/photo-960.jpg', width: 960 },
        wide: { url: '/photo-1920.jpg', width: 1920 },
      },
    } as Media
    expect(responsiveImage(image)).toEqual({
      src: '/photo-960.jpg',
      srcSet: '/photo-480.jpg 480w, /photo-960.jpg 960w, /photo.jpg 1920w',
      width: 1920,
      height: 1280,
    })
    expect(responsiveImage({ url: '/logo.svg' } as Media)).toMatchObject({
      src: '/logo.svg',
      srcSet: undefined,
    })
    expect(responsiveImage(123)).toBeUndefined()
  })
})
