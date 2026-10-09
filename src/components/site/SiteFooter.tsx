import React from 'react'
import Link from 'next/link'
import type { CityPage, SiteSetting } from '@/payload-types'
import { cityInfo, cityPath } from '@/lib/locations'
import { mediaUrl } from '@/lib/media'
import { selectedLogo } from '@/lib/site-content'
import { whatsappUrl } from '@/lib/whatsapp'
import { BrandMark } from './BrandMark'

export function SiteFooter({
  settings,
  cityPages,
}: {
  settings: SiteSetting
  cityPages: CityPage[]
}) {
  const whatsapp = whatsappUrl(settings.whatsapp, settings.whatsappMessage)
  const floatingAction = Boolean(whatsapp && settings.showWhatsAppButton !== false)
  return (
    <footer className={`footer${floatingAction ? ' footer--with-whatsapp' : ''}`}>
      <div className="container footer__inner">
        <div>
          <p className="footer__brand">
            <BrandMark
              src={selectedLogo(settings, mediaUrl(settings.logo))}
              className="footer__logo"
            />
            {settings.brandName}
          </p>
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
          <a href="#contact">{settings.bookingLabel || 'Book a date'}</a>
          <Link href="/privacy">Privacy</Link>
        </div>
        {cityPages.length > 0 && (
          <nav className="footer__cities" aria-label="Wedding hosting by city">
            {cityPages.map((page) => (
              <Link key={page.city} href={cityPath(page.city)}>
                Wedding & event anchor in {cityInfo(page.city).label}
              </Link>
            ))}
          </nav>
        )}
        <p className="footer__copy muted">
          © {new Date().getFullYear()} {settings.brandName}.{' '}
          {settings.footerNote ?? 'All celebrations reserved.'}
        </p>
      </div>
    </footer>
  )
}
