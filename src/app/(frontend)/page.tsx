import React from 'react'

import { eventTypes } from '@/collections/Inquiries'
import { Accent } from '@/components/site/Accent'
import { BgVideo } from '@/components/site/BgVideo'
import { BrandIntro } from '@/components/site/BrandIntro'
import { InquiryForm } from '@/components/site/InquiryForm'
import { HeroFilms } from '@/components/site/HeroFilms'
import { Moments } from '@/components/site/Moments'
import { Nav } from '@/components/site/Nav'
import { Reveal } from '@/components/site/Reveal'
import { Testimonials } from '@/components/site/Testimonials'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteImage } from '@/components/site/SiteImage'
import { WhatsAppFloat, WhatsAppIcon } from '@/components/site/WhatsAppButton'
import { asMedia, getCityPages, getSiteData, mediaUrl } from '@/lib/data'
import { gamesBackdrop, navigationLinks, selectedLogo } from '@/lib/site-content'
import { cityPath, isInCity } from '@/lib/locations'
import { reelCards as makeReelCards } from '@/lib/reel-cards'
import { businessGraph, latestModified, serializeJsonLd } from '@/lib/seo'
import { heroFilms } from '@/lib/hero-media'
import { whatsappDigits, whatsappUrl } from '@/lib/whatsapp'

export const revalidate = 60

export default async function HomePage() {
  const [{ home, settings, reels, testimonials }, cityPages] = await Promise.all([
    getSiteData(),
    getCityPages(),
  ])
  const { hero } = home
  const films = heroFilms(mediaUrl(hero.video), mediaUrl(hero.poster, 'wide'), hero.films)
  const logo = selectedLogo(settings, mediaUrl(settings.logo))
  const about = home.about ?? {}
  const games = home.games ?? {}
  const contact = home.contact ?? {}

  const reelCards = makeReelCards(reels)

  const whatsapp = whatsappUrl(settings.whatsapp, settings.whatsappMessage)
  const highlights = home.marquee ?? []
  const highlightTargets: Record<string, string | undefined> = {
    haldi: home.services?.length ? '#services' : undefined,
    mehendi: home.services?.length ? '#services' : undefined,
    sangeet: home.services?.length ? '#services' : undefined,
    wedding: home.services?.length ? '#services' : undefined,
    reception: home.services?.length ? '#services' : undefined,
    'new game alert': games.heading ? '#games' : undefined,
    mumbai: home.destinations?.length ? '#destinations' : undefined,
    bengaluru: home.destinations?.length ? '#destinations' : undefined,
    'destination weddings': home.destinations?.length ? '#destinations' : undefined,
  }

  const available = new Set(['about', 'services', 'contact'])
  if (reelCards.length) available.add('moments')
  if (home.gallery?.length) available.add('gallery')
  if (games.heading) available.add('games')
  if (home.destinations?.length) available.add('destinations')
  if (testimonials.length) available.add('love')
  const backdrop = gamesBackdrop(games, mediaUrl(games.background, 'wide'))
  const jsonLd = businessGraph(settings, home, {
    modified: latestModified(
      home.updatedAt,
      settings.updatedAt,
      ...reels.map((r) => r.updatedAt),
      ...testimonials.map((t) => t.updatedAt),
    ),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Reveal enabled={settings.scrollAnimations !== false} />
      {settings.showLogoIntro !== false && <BrandIntro brand={settings.brandName} logo={logo} />}
      <Nav
        brand={settings.brandName}
        instagram={settings.instagram}
        logo={logo}
        links={navigationLinks(settings, available)}
        bookingLabel={settings.bookingLabel || 'Book a date'}
        transitionLogo={settings.headerLogoTransition !== false}
      />

      <main id="top" data-motion={settings.scrollAnimations === false ? 'off' : undefined}>
        {/* HERO */}
        <section className="hero">
          <HeroFilms
            films={films}
            autoPlay={hero.autoPlay !== false}
            key={JSON.stringify([films, hero.autoPlay])}
          >
            <div className="hero__veil" />
            <div className="container hero__content">
              <div className="hero__identity">
                <h1 className="hero__title">
                  <Accent text={hero.headline} />
                </h1>
                {hero.eyebrow && <p className="hero__role">{hero.eyebrow}</p>}
                {hero.subheadline && <p className="hero__sub">{hero.subheadline}</p>}
              </div>
              <div className="hero__actions">
                <a href="#contact" className="btn btn--gold hero__book">
                  {hero.primaryLabel || 'Check your date'}
                </a>
                <a href="#moments" className="hero__watch">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.25" />
                    <path d="m10 8 6 4-6 4V8Z" fill="currentColor" />
                  </svg>
                  {hero.secondaryLabel || 'Watch the moments'}
                </a>
              </div>
            </div>
          </HeroFilms>
        </section>

        {highlights.length > 0 && (
          <div id="celebrations" className="hero-highlights">
            <div className="container">
              <ul
                className="hero-highlights__list"
                role="list"
                aria-label="Celebrations and destinations"
                data-reveal="heading"
              >
                {highlights.map((item, i) => {
                  const target =
                    item.section === 'none'
                      ? undefined
                      : item.section && item.section !== 'auto'
                        ? available.has(item.section)
                          ? `#${item.section}`
                          : undefined
                        : highlightTargets[item.text.trim().toLowerCase()]
                  return (
                    <li
                      key={item.id ?? i}
                      className={target === '#games' ? 'hero-highlights__feature' : undefined}
                    >
                      {target ? <a href={target}>{item.text}</a> : <span>{item.text}</span>}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}

        {/* ABOUT */}
        <section id="about" className="section about">
          <div className="container about__grid">
            <figure className="about__portrait" data-reveal="portrait">
              {mediaUrl(about.portrait) && (
                <SiteImage
                  media={about.portrait}
                  alt={settings.anchorName}
                  sizes="(max-width: 860px) 92vw, (max-width: 1348px) 42vw, 510px"
                />
              )}
              <figcaption>
                <span>{settings.anchorName}</span>
                <small>{settings.baseCity}</small>
              </figcaption>
            </figure>
            <div className="about__copy" data-reveal="copy">
              <p className="eyebrow">{about.kicker}</p>
              <h2 className="h2">
                <Accent text={about.heading} />
              </h2>
              {about.body?.split(/\n{2,}/).map((p, i) => (
                <p key={i} className="lead">
                  {p}
                </p>
              ))}
              {about.signature && <p className="signature">{about.signature}</p>}
              {home.stats && home.stats.length > 0 && (
                <dl className="stats">
                  {home.stats.map((s, i) => (
                    <div key={i}>
                      <dt>{s.value}</dt>
                      <dd>{s.label}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="section services">
          <div className="container">
            <div className="section__head" data-reveal="heading">
              <p className="eyebrow">{home.servicesKicker ?? 'Ceremonies'}</p>
              <h2 className="h2">
                <Accent text={home.servicesHeading} />
              </h2>
            </div>
            <div className="services__grid" data-reveal-group>
              {home.services?.map((s, i) => (
                <article
                  key={i}
                  className={`service service--${s.accent ?? 'gold'}`}
                  data-reveal="card"
                >
                  {mediaUrl(s.image) && (
                    <SiteImage
                      media={s.image}
                      alt={`${s.title} with ${settings.anchorName}`}
                      sizes="(max-width: 560px) 92vw, (max-width: 1000px) 45vw, 390px"
                    />
                  )}
                  <div className="service__body">
                    <span className="service__num">{String(i + 1).padStart(2, '0')}</span>
                    <h3>{s.title}</h3>
                    {s.description && <p>{s.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* MOMENTS */}
        {reelCards.length > 0 && (
          <section id="moments" className="section moments">
            <div className="container">
              <div className="section__head section__head--split" data-reveal="heading">
                <div>
                  <p className="eyebrow">{home.momentsKicker ?? 'Moments'}</p>
                  <h2 className="h2">
                    <Accent text={home.momentsHeading} />
                  </h2>
                </div>
                {home.momentsIntro && <p className="lead">{home.momentsIntro}</p>}
              </div>
              <Moments reels={reelCards} youtubeChannel={settings.youtube} />
            </div>
          </section>
        )}

        {/* GALLERY */}
        {home.gallery && home.gallery.length > 0 && (
          <section id="gallery" className="section gallery">
            <div className="container">
              <div className="section__head" data-reveal="heading">
                <p className="eyebrow">{home.galleryKicker ?? 'Gallery'}</p>
                <h2 className="h2">
                  <Accent text={home.galleryHeading} />
                </h2>
              </div>
              <div className="gallery__grid" data-reveal-group>
                {home.gallery.map((g, i) => {
                  const m = asMedia(g.image)
                  if (!m) return null
                  return (
                    <figure key={i} className="gallery__item" data-reveal="photo">
                      <SiteImage
                        media={m}
                        alt={m.alt}
                        sizes="(max-width: 560px) 46vw, (max-width: 1000px) 30vw, 280px"
                      />
                      {g.caption && <figcaption>{g.caption}</figcaption>}
                    </figure>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* GAMES */}
        {games.heading && (
          <section
            id="games"
            className="section games"
            style={
              {
                '--games-backdrop': backdrop ? `url(${JSON.stringify(backdrop)})` : 'none',
              } as React.CSSProperties
            }
          >
            <div className="container games__grid">
              <div className="games__copy" data-reveal="copy">
                <p className="games__alert">{games.kicker}</p>
                <h2 className="h2">
                  <Accent text={games.heading} />
                </h2>
                {games.body && <p className="lead">{games.body}</p>}
                {games.list && games.list.length > 0 && (
                  <ul className="games__list">
                    {games.list.map((g, i) => (
                      <li key={i}>{g.name}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="games__phone" data-reveal="feature">
                <BgVideo src={mediaUrl(games.video)} poster={mediaUrl(games.poster, 'card')} />
              </div>
            </div>
          </section>
        )}

        {/* DESTINATIONS */}
        {home.destinations && home.destinations.length > 0 && (
          <section id="destinations" className="section destinations">
            <div className="container">
              <div className="section__head" data-reveal="heading">
                <p className="eyebrow">{home.destinationsKicker ?? 'Where we’ve celebrated'}</p>
                <h2 className="h2">
                  <Accent text={home.destinationsHeading} />
                </h2>
              </div>
              <div className="destinations__grid" data-reveal-group>
                {home.destinations.map((d, i) => {
                  const cityPage = cityPages.find((page) => isInCity(d.city, page.city))
                  return (
                    <figure key={i} className="destination" data-reveal="photo">
                      {mediaUrl(d.image) && (
                        <SiteImage
                          media={d.image}
                          alt={`${settings.anchorName} at ${d.venue || 'a celebration'} in ${d.city}`}
                          sizes="(max-width: 600px) 60vw, (max-width: 1000px) 36vw, 230px"
                        />
                      )}
                      <figcaption>
                        <strong>
                          {cityPage ? <a href={cityPath(cityPage.city)}>{d.city}</a> : d.city}
                        </strong>
                        {d.venue && <span>{d.venue}</span>}
                      </figcaption>
                    </figure>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* TESTIMONIALS */}
        {testimonials.length > 0 && (
          <section id="love" className="section love">
            <div className="container">
              <div className="section__head" data-reveal="heading">
                <p className="eyebrow">{home.testimonialsKicker ?? 'Kind words'}</p>
                <h2 className="h2">
                  <Accent text={home.testimonialsHeading} />
                </h2>
              </div>
              <Testimonials
                motionEnabled={settings.scrollAnimations !== false}
                reviews={testimonials.map((t) => ({
                  id: t.id,
                  quote: t.quote,
                  name: t.name,
                  event: t.event,
                  photo: mediaUrl(t.photo, 'thumb'),
                  audience: t.audience,
                  sourcePlatform: t.sourcePlatform,
                  sourceUrl: t.sourceUrl,
                  sourceHandle: t.sourceHandle,
                }))}
              />
            </div>
          </section>
        )}

        {/* CONTACT */}
        <section id="contact" className="section contact">
          <div className="container contact__grid">
            <div className="contact__copy" data-reveal="copy">
              <p className="eyebrow">{contact.kicker ?? 'Bookings'}</p>
              <h2 className="h2">
                <Accent text={contact.heading} />
              </h2>
              {contact.body && <p className="lead">{contact.body}</p>}
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
                successMessage={contact.successMessage || 'Thank you! We’ll be in touch soon.'}
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

      <SiteFooter settings={settings} cityPages={cityPages} />
    </>
  )
}
