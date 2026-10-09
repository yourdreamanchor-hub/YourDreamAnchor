import type { Metadata } from 'next'
import type { Home, Media, SiteSetting } from '@/payload-types'

import { asMedia, mediaUrl } from './media'
import { publicSiteOrigin } from './site-origin'

export const defaultSeoTitle = 'Wedding & Event Anchor in Mumbai & Bengaluru | Your Dream Anchor'
export const defaultSeoDescription =
  'Akshay R Takalkar, wedding anchor and emcee in Mumbai and Bengaluru. Explore real wedding, haldi, sangeet and reception films, and check your celebration date.'

export function canonicalURL(path = '/') {
  return new URL(path, publicSiteOrigin).href
}

export function indexableEnvironment(env: Record<string, string | undefined> = process.env) {
  return (
    env.NODE_ENV !== 'development' && !['preview', 'development'].includes(env.VERCEL_ENV || '')
  )
}

export function absolutePublicURL(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value, publicSiteOrigin)
    return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : undefined
  } catch {
    return undefined
  }
}

export function pageMetadata(
  settings: SiteSetting,
  options: {
    path?: string
    title?: string
    description?: string
    image?: Media | number | null
  } = {},
): Metadata {
  const title = options.title || settings.metaTitle || defaultSeoTitle
  const description = options.description || settings.metaDescription || defaultSeoDescription
  const selectedImage = options.image || settings.shareImage
  const media = asMedia(selectedImage)
  const image =
    absolutePublicURL(mediaUrl(selectedImage, 'wide')) ||
    canonicalURL('/media/hero-quality-v1-poster.jpg')
  const dimensions = media?.sizes?.wide?.url ? media.sizes.wide : media
  const index = indexableEnvironment()
  return {
    metadataBase: new URL(publicSiteOrigin),
    title,
    description,
    alternates: { canonical: canonicalURL(options.path) },
    authors: [{ name: settings.anchorName, url: canonicalURL('/#about') }],
    robots: {
      index,
      follow: index,
      googleBot: {
        index,
        follow: index,
        'max-image-preview': 'large',
        'max-video-preview': -1,
        'max-snippet': -1,
      },
    },
    verification: settings.googleSiteVerification
      ? { google: settings.googleSiteVerification.trim() }
      : undefined,
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      siteName: settings.brandName,
      title,
      description,
      url: canonicalURL(options.path),
      images: [
        {
          url: image,
          alt: media?.alt || `${settings.anchorName} — ${settings.brandName}`,
          width: dimensions?.width || undefined,
          height: dimensions?.height || undefined,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: image, alt: media?.alt || settings.brandName }],
    },
  }
}

/** Script-safe even when an editor uses HTML-like text. */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function latestModified(...values: (string | null | undefined)[]): string | undefined {
  const dates = values.filter(
    (value): value is string => Boolean(value) && Number.isFinite(Date.parse(value!)),
  )
  return dates.sort((a, b) => Date.parse(b) - Date.parse(a))[0]
}

/** Describe the real business and services, without inventing offices or review ratings. */
export function businessGraph(
  settings: SiteSetting,
  home: Home,
  page: {
    path?: string
    title?: string
    description?: string
    city?: string
    modified?: string
  } = {},
) {
  const url = canonicalURL(page.path)
  const organization = canonicalURL('/#organization')
  const person = canonicalURL('/#anchor')
  const website = canonicalURL('/#website')
  const image = absolutePublicURL(mediaUrl(settings.shareImage, 'wide'))
  const served = page.city
    ? [{ '@type': 'City', name: page.city }]
    : [
        { '@type': 'City', name: 'Mumbai' },
        { '@type': 'City', name: 'Bengaluru', alternateName: 'Bangalore' },
        { '@type': 'Country', name: 'India' },
      ]
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': organization,
      name: settings.brandName,
      url: canonicalURL(),
      description: settings.metaDescription || defaultSeoDescription,
      image,
      telephone: settings.phone || undefined,
      email: settings.email || undefined,
      sameAs: [settings.instagram, settings.youtube].map(absolutePublicURL).filter(Boolean),
      founder: { '@id': person },
    },
    {
      '@type': 'Person',
      '@id': person,
      name: settings.anchorName,
      jobTitle: settings.role,
      url: canonicalURL('/#about'),
      worksFor: { '@id': organization },
    },
    {
      '@type': 'WebSite',
      '@id': website,
      name: settings.brandName,
      url: canonicalURL(),
      inLanguage: 'en-IN',
      publisher: { '@id': organization },
    },
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: page.title || settings.metaTitle || defaultSeoTitle,
      description: page.description || settings.metaDescription || defaultSeoDescription,
      isPartOf: { '@id': website },
      about: { '@id': person },
      inLanguage: 'en-IN',
      dateModified: page.modified,
      ...(page.city ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    },
    {
      '@type': 'Service',
      '@id': `${url}#hosting`,
      name: `Wedding and event anchoring${page.city ? ` in ${page.city}` : ''}`,
      serviceType: 'Wedding and event anchoring',
      url,
      provider: { '@id': organization },
      areaServed: served,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Celebration hosting',
        itemListElement: (home.services || []).map(({ title, description }) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: title, description: description || undefined },
        })),
      },
    },
  ]
  if (page.city)
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: settings.brandName, item: canonicalURL() },
        { '@type': 'ListItem', position: 2, name: page.city, item: url },
      ],
    })
  return { '@context': 'https://schema.org', '@graph': graph }
}
