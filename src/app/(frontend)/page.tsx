import React from 'react'

import { eventTypes } from '@/collections/Inquiries'
import { reelCategories } from '@/collections/Reels'
import { Accent } from '@/components/site/Accent'
import { BgVideo } from '@/components/site/BgVideo'
import { InquiryForm } from '@/components/site/InquiryForm'
import { Moments, type ReelCard } from '@/components/site/Moments'
import { Nav } from '@/components/site/Nav'
import { Reveal } from '@/components/site/Reveal'
import { WhatsAppFloat, WhatsAppIcon } from '@/components/site/WhatsAppButton'
import { asMedia, getSiteData, mediaUrl } from '@/lib/data'
import { whatsappDigits, whatsappUrl } from '@/lib/whatsapp'

export const revalidate = 60

const categoryLabel = Object.fromEntries(reelCategories.map((c) => [c.value, c.label]))

export default async function HomePage() {
  const { home, settings, reels, testimonials } = await getSiteData()
  const { hero } = home
  const about = home.about ?? {}
  const games = home.games ?? {}
  const contact = home.contact ?? {}

  const reelCards: ReelCard[] = reels.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    categoryLabel: categoryLabel[r.category] ?? r.category,
    location: r.location,
    caption: r.caption,
    video: mediaUrl(r.video),
    poster: mediaUrl(r.poster, 'card'),
    instagramUrl: r.instagramUrl,
  }))

  const whatsapp = whatsappUrl(settings.whatsapp, settings.whatsappMessage)
  const marquee = home.marquee ?? []

  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: settings.brandName,
    description: settings.metaDescription,
    url: siteUrl,
    image: mediaUrl(settings.shareImage, 'wide'),
    telephone: settings.phone || undefined,
    email: settings.email || undefined,
    areaServed: 'India',
    sameAs: [settings.instagram, settings.youtube].filter(Boolean),
    founder: { '@type': 'Person', name: settings.anchorName, jobTitle: settings.role },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Reveal />
      <Nav brand={settings.brandName} instagram={settings.instagram} logo={mediaUrl(settings.logo, 'thumb')} />

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <BgVideo className="hero__video" src={mediaUrl(hero.video)} poster={mediaUrl(hero.poster, 'wide')} />
          <div className="hero__veil" />
          <div className="hero__lights" aria-hidden>
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
          <div className="container hero__content">
            <p className="eyebrow hero__eyebrow">
              <span className="dot" /> {hero.eyebrow}
            </p>
            <h1 className="hero__title">
              <Accent text={hero.headline} />
            </h1>
            {hero.subheadline && <p className="hero__sub">{hero.subheadline}</p>}
            <div className="hero__actions">
              <a href="#contact" className="btn btn--gold btn--lg">
                {hero.primaryLabel || 'Check your date'}
              </a>
              <a href="#moments" className="btn btn--ghost btn--lg">
                <span className="btn__play" aria-hidden>
                  ▶
                </span>
                {hero.secondaryLabel || 'Watch the moments'}
              </a>
            </div>
          </div>
          <div className="hero__sig container">
            <span>{settings.anchorName}</span>
            <span className="muted">{settings.role}</span>
          </div>
        </section>

        {marquee.length > 0 && (
          <div className="marquee" aria-label={marquee.map((m) => m.text).join(', ')}>
            <div className="marquee__track" aria-hidden>
              {[0, 1].map((k) => (
                <div className="marquee__group" key={k}>
                  {marquee.map((m, i) => (
                    <span key={i}>
                      {m.text} <i>✦</i>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABOUT */}
        <section id="about" className="section about">
          <div className="container about__grid">
            <figure className="about__portrait" data-reveal>
              {mediaUrl(about.portrait) && <img src={mediaUrl(about.portrait, 'card')} alt={settings.anchorName} />}
              <figcaption>
                <span>{settings.anchorName}</span>
                <small>{settings.baseCity}</small>
              </figcaption>
            </figure>
            <div className="about__copy" data-reveal>
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
            <div className="section__head" data-reveal>
              <p className="eyebrow">Ceremonies</p>
              <h2 className="h2">
                <Accent text={home.servicesHeading} />
              </h2>
            </div>
            <div className="services__grid">
              {home.services?.map((s, i) => (
                <article key={i} className={`service service--${s.accent ?? 'gold'}`} data-reveal>
                  {mediaUrl(s.image) && <img src={mediaUrl(s.image, 'card')} alt="" loading="lazy" />}
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
              <div className="section__head section__head--split" data-reveal>
                <div>
                  <p className="eyebrow">Moments</p>
                  <h2 className="h2">
                    <Accent text={home.momentsHeading} />
                  </h2>
                </div>
                {home.momentsIntro && <p className="lead">{home.momentsIntro}</p>}
              </div>
              <Moments reels={reelCards} />
            </div>
          </section>
        )}

        {/* GALLERY */}
        {home.gallery && home.gallery.length > 0 && (
          <section id="gallery" className="section gallery">
            <div className="container">
              <div className="section__head" data-reveal>
                <p className="eyebrow">Gallery</p>
                <h2 className="h2">
                  <Accent text={home.galleryHeading} />
                </h2>
              </div>
              <div className="gallery__grid">
                {home.gallery.map((g, i) => {
                  const m = asMedia(g.image)
                  if (!m) return null
                  return (
                    <figure key={i} className="gallery__item" data-reveal>
                      <img
                        src={mediaUrl(m, 'card')}
                        alt={m.alt}
                        width={m.width ?? undefined}
                        height={m.height ?? undefined}
                        loading="lazy"
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
          <section id="games" className="section games">
            <div className="container games__grid">
              <div className="games__copy" data-reveal>
                <p className="games__alert">🚨 {games.kicker}</p>
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
              <div className="games__phone" data-reveal>
                <BgVideo src={mediaUrl(games.video)} poster={mediaUrl(games.poster, 'card')} />
              </div>
            </div>
          </section>
        )}

        {/* DESTINATIONS */}
        {home.destinations && home.destinations.length > 0 && (
          <section className="section destinations">
            <div className="container">
              <div className="section__head" data-reveal>
                <p className="eyebrow">Where we’ve celebrated</p>
                <h2 className="h2">
                  <Accent text={home.destinationsHeading} />
                </h2>
              </div>
              <div className="destinations__grid">
                {home.destinations.map((d, i) => (
                  <figure key={i} className="destination" data-reveal>
                    {mediaUrl(d.image) && <img src={mediaUrl(d.image, 'card')} alt="" loading="lazy" />}
                    <figcaption>
                      <strong>{d.city}</strong>
                      {d.venue && <span>{d.venue}</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TESTIMONIALS */}
        {testimonials.length > 0 && (
          <section id="love" className="section love">
            <div className="container">
              <div className="section__head" data-reveal>
                <p className="eyebrow">Kind words</p>
                <h2 className="h2">
                  <Accent text={home.testimonialsHeading} />
                </h2>
              </div>
              <div className="love__grid">
                {testimonials.map((t) => (
                  <blockquote key={t.id} className="quote" data-reveal>
                    <span className="quote__mark" aria-hidden>
                      “
                    </span>
                    <p>{t.quote}</p>
                    <footer>
                      {mediaUrl(t.photo) && <img src={mediaUrl(t.photo, 'thumb')} alt="" />}
                      <div>
                        <strong>{t.name}</strong>
                        {t.event && <small>{t.event}</small>}
                      </div>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CONTACT */}
        <section id="contact" className="section contact">
          <div className="container contact__grid">
            <div className="contact__copy" data-reveal>
              <p className="eyebrow">Bookings</p>
              <h2 className="h2">
                <Accent text={contact.heading} />
              </h2>
              {contact.body && <p className="lead">{contact.body}</p>}
              <ul className="contact__direct">
                {whatsapp && (
                  <li>
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn--whatsapp">
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
            <div className="contact__card" data-reveal>
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

      <footer className="footer">
        <div className="container footer__inner">
          <div>
            <p className="footer__brand">{settings.brandName}</p>
            <p className="muted">
              {settings.anchorName} · {settings.role}
            </p>
          </div>
          <div className="footer__links">
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noreferrer">
                Instagram {settings.instagramHandle}
              </a>
            )}
            {settings.youtube && (
              <a href={settings.youtube} target="_blank" rel="noreferrer">
                YouTube
              </a>
            )}
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            )}
            <a href="#contact">Book a date</a>
            <a href="/privacy">Privacy</a>
          </div>
          <p className="footer__copy muted">
            © {new Date().getFullYear()} {settings.brandName}. All celebrations reserved.
          </p>
        </div>
      </footer>
    </>
  )
}
