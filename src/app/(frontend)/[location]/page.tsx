import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { eventTypes } from '@/collections/Inquiries'
import { Accent } from '@/components/site/Accent'
import { InquiryForm } from '@/components/site/InquiryForm'
import { Moments } from '@/components/site/Moments'
import { Nav } from '@/components/site/Nav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteImage } from '@/components/site/SiteImage'
import { WhatsAppFloat, WhatsAppIcon } from '@/components/site/WhatsAppButton'
import { getCityPages, getSiteData } from '@/lib/data'
import { cityFromSlug, cityInfo, cityPath, isInCity } from '@/lib/locations'
import { mediaUrl } from '@/lib/media'
import { reelCards } from '@/lib/reel-cards'
import { businessGraph, latestModified, pageMetadata, serializeJsonLd } from '@/lib/seo'
import { selectedLogo } from '@/lib/site-content'
import { whatsappDigits, whatsappUrl } from '@/lib/whatsapp'

type Props = { params: Promise<{ location: string }> }
export const revalidate = 60
export const dynamic = 'force-static'

export async function generateStaticParams() {
  return (await getCityPages()).map((page) => ({ location: cityInfo(page.city).slug }))
}

async function pageData(params: Props['params']) {
  const city = cityFromSlug((await params).location)
  if (!city) notFound()
  const [data, pages] = await Promise.all([getSiteData(), getCityPages()])
  const page = pages.find((entry) => entry.city === city)
  if (!page) notFound()
  const image = page.image || data.home.destinations?.find((d) => isInCity(d.city, city))?.image
  const films = data.reels.filter((reel) => isInCity(reel.location, city))
  return { ...data, pages, page, image, films, city }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { settings, page, city, image } = await pageData(params)
  return pageMetadata(settings, {
    path: cityPath(city),
    title: page.metaTitle,
    description: page.metaDescription,
    image,
  })
}

export default async function CityPage({ params }: Props) {
  const { home, settings, pages, page, city, image, films } = await pageData(params)
  const cityName = cityInfo(city).label
  const whatsapp = whatsappUrl(settings.whatsapp, settings.whatsappMessage)
  const links = [
    { href: '/', label: 'Home' },
    { href: '#services', label: 'Celebrations' },
    ...(films.length ? [{ href: '#moments', label: 'Films' }] : []),
    { href: '#planning', label: 'Planning' },
  ]
  const graph = businessGraph(settings, home, {
    path: cityPath(city),
    title: page.metaTitle,
    description: page.metaDescription,
    city: cityName,
    modified: latestModified(
      page.updatedAt,
      home.updatedAt,
      settings.updatedAt,
      ...films.map((f) => f.updatedAt),
    ),
  })
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
      />
      <Nav
        brand={settings.brandName}
        instagram={settings.instagram}
        logo={selectedLogo(settings, mediaUrl(settings.logo))}
        links={links}
        bookingLabel={settings.bookingLabel || 'Book a date'}
        transitionLogo={settings.headerLogoTransition !== false}
      />
      <main id="top" className="city-page">
        <section className="container city-opening">
          <nav className="city-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">{settings.brandName}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{cityName}</span>
          </nav>
          <div className="city-opening__grid">
            <div className="city-opening__copy">
              <h1 className="h2 city-opening__title">
                <Accent text={page.headline} />
              </h1>
              <p className="lead">{page.intro}</p>
              <a href="#contact" className="btn btn--gold">
                {home.hero.primaryLabel || 'Check your date'}
              </a>
              {films.length > 0 && (
                <a href="#moments" className="link city-opening__watch">
                  {home.hero.secondaryLabel || 'Watch the moments'}
                </a>
              )}
            </div>
            {image && (
              <figure className="city-opening__photo">
                <SiteImage
                  media={image}
                  alt={`A celebration hosted by ${settings.anchorName} in ${cityName}`}
                  sizes="(max-width: 800px) 92vw, (max-width: 1348px) 40vw, 510px"
                  priority
                />
                {page.imageCaption && <figcaption>{page.imageCaption}</figcaption>}
              </figure>
            )}
          </div>
        </section>
        {home.services?.length ? (
          <section id="services" className="section city-services">
            <div className="container">
              <div className="section__head">
                <h2 className="h2">
                  <Accent text={page.servicesHeading} />
                </h2>
              </div>
              <div className="city-services__list">
                {home.services.map((service, index) => (
                  <article key={service.id || index}>
                    <h3>{service.title}</h3>
                    <p className="lead">{service.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        {films.length > 0 && (
          <section id="moments" className="section moments">
            <div className="container">
              <div className="section__head section__head--split">
                <h2 className="h2">
                  <Accent text={page.momentsHeading} />
                </h2>
                <p className="lead">{page.momentsIntro}</p>
              </div>
              <Moments reels={reelCards(films)} youtubeChannel={settings.youtube} />
            </div>
          </section>
        )}
        <section id="planning" className="section city-planning">
          <div className="container city-planning__grid">
            <h2 className="h2">
              <Accent text={page.planningHeading} />
            </h2>
            <div>
              {page.planningBody.split(/\n{2,}/).map((paragraph, i) => (
                <p className="lead" key={i}>
                  {paragraph}
                </p>
              ))}
            </div>
            {page.questions?.length ? (
              <div className="city-questions">
                {page.questions.map((question, i) => (
                  <details key={question.id || i}>
                    <summary>{question.question}</summary>
                    <p className="lead">{question.answer}</p>
                  </details>
                ))}
              </div>
            ) : null}
          </div>
        </section>
        <section id="contact" className="section contact">
          <div className="container contact__grid">
            <div className="contact__copy">
              <h2 className="h2">
                <Accent text={page.contactHeading} />
              </h2>
              <p className="lead">{page.contactBody}</p>
              <ul className="contact__direct">
                {whatsapp && (
                  <li>
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn--whatsapp"
                    >
                      <WhatsAppIcon size={20} />
                      Chat on WhatsApp
                    </a>
                  </li>
                )}
                {settings.phone && (
                  <li>
                    <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="link">
                      {settings.phone}
                    </a>
                  </li>
                )}
                {settings.email && (
                  <li>
                    <a href={`mailto:${settings.email}`} className="link">
                      {settings.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
            <div className="contact__card">
              <InquiryForm
                eventTypes={eventTypes}
                defaultCity={cityName}
                successMessage={
                  home.contact?.successMessage || 'Thank you! We’ll be in touch soon.'
                }
                whatsappNumber={whatsappDigits(settings.whatsapp)}
                anchorFirstName={settings.anchorName.split(' ')[0]}
              />
            </div>
          </div>
        </section>
      </main>
      {whatsapp && settings.showWhatsAppButton !== false && (
        <WhatsAppFloat href={whatsapp} name={settings.anchorName.split(' ')[0]} />
      )}
      <SiteFooter settings={settings} cityPages={pages} />
    </>
  )
}
