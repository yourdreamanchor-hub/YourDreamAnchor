'use client'

import React, { useEffect, useRef, useState } from 'react'

import { brandLogo, brandWordmark, monogramUrl } from '@/lib/brand'
import { morphWordmark, wordmarkGlyphs } from '@/lib/brand-morph'
import { BrandMark } from './BrandMark'

const links = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Ceremonies' },
  { href: '#moments', label: 'Moments' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#games', label: 'Games' },
  { href: '#love', label: 'Kind words' },
]

function Arrow({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Nav({
  brand,
  instagram,
  logo,
}: {
  brand: string
  instagram?: string | null
  logo?: string
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const header = useRef<HTMLElement>(null)
  const navigation = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const destination = useRef<string | null>(null)
  const wordmark = useRef<HTMLSpanElement>(null)
  const mark = useRef<HTMLSpanElement>(null)
  const morph = useRef<SVGSVGElement>(null)
  const canMorph = brandWordmark(brand) === 'YourDreamAnchor' && brandLogo(logo) === monogramUrl

  const closeMenu = (href?: string) => {
    if (open && href?.startsWith('#')) destination.current = href
    setOpen(false)
  }

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('main > section[id]')]
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const paths = morph.current ? [...morph.current.querySelectorAll('path')] : []
    let previousProgress = -1
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled(window.scrollY > 24)
      const progress = reduce.matches
        ? Number(window.scrollY > 24)
        : Math.min(1, Math.max(0, (window.scrollY - 40) / 360))
      if (morph.current && wordmark.current) {
        if (progress !== previousProgress) {
          wordmark.current.style.visibility = 'hidden'
          morph.current.style.display = 'block'
          morphWordmark(paths, progress)
        }
      } else if (wordmark.current && mark.current) {
        wordmark.current.style.visibility = 'visible'
        wordmark.current.style.opacity = String(1 - progress)
        wordmark.current.style.clipPath = `inset(0 ${progress * 78}% 0 0)`
        wordmark.current.style.transform = `translateX(${-12 * progress}px) scale(${1 - progress * 0.06})`
        mark.current.style.opacity = String(progress)
        mark.current.style.transform = `translateX(${12 * (1 - progress)}px) scale(${0.9 + progress * 0.1})`
      }
      previousProgress = progress
      let current = ''
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= window.innerHeight * 0.28) current = section.id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    reduce.addEventListener('change', onScroll)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      reduce.removeEventListener('change', onScroll)
    }
  }, [canMorph])

  useEffect(() => {
    if (!open) {
      const href = destination.current
      destination.current = null
      if (!href) return
      const section = document.querySelector<HTMLElement>(href)
      const target = section?.querySelector<HTMLElement>('h1, h2') ?? section
      if (!target) return
      const previousTabIndex = target.getAttribute('tabindex')
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
      const restore = () => {
        if (previousTabIndex === null) target.removeAttribute('tabindex')
        else target.setAttribute('tabindex', previousTabIndex)
      }
      target.addEventListener('blur', restore, { once: true })
      return () => {
        restore()
        target.removeEventListener('blur', restore)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const background = [...document.querySelectorAll<HTMLElement>('main, footer, .wa-float')].map(
      (element) => ({ element, inert: element.inert }),
    )
    background.forEach(({ element }) => {
      element.inert = true
    })
    navigation.current
      ?.querySelector<HTMLAnchorElement>('.nav__item')
      ?.focus({ preventScroll: true })

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggle.current?.focus()
      } else if (event.key === 'Tab') {
        const first = header.current?.querySelector<HTMLAnchorElement>('.nav__brand')
        const last = toggle.current
        const outside = !header.current?.contains(document.activeElement)
        if (
          outside ||
          (event.shiftKey && document.activeElement === first) ||
          (!event.shiftKey && document.activeElement === last)
        ) {
          event.preventDefault()
          ;(event.shiftKey ? last : first)?.focus()
        }
      }
    }
    const desktop = window.matchMedia('(min-width: 1081px)')
    const onDesktop = () => {
      if (desktop.matches) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    desktop.addEventListener('change', onDesktop)
    return () => {
      document.body.style.overflow = previousOverflow
      background.forEach(({ element, inert }) => {
        element.inert = inert
      })
      document.removeEventListener('keydown', onKey)
      desktop.removeEventListener('change', onDesktop)
    }
  }, [open])

  return (
    <header
      ref={header}
      className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}
    >
      <div className="nav__inner">
        <a href="#top" className="nav__brand" aria-label={brand} onClick={() => closeMenu('#top')}>
          <span ref={wordmark} className="nav__wordmark" aria-hidden="true">
            <span className="nav__brand-name">{brandWordmark(brand)}</span>
          </span>
          {canMorph ? (
            <svg
              ref={morph}
              className="nav__morph"
              width="234"
              height="48"
              viewBox="0 0 234 48"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              {wordmarkGlyphs.map((glyph, index) => (
                <path key={index} d={glyph.sourceD} fillRule="evenodd" />
              ))}
            </svg>
          ) : (
            <span ref={mark} className="nav__symbol" aria-hidden="true">
              <BrandMark src={brandLogo(logo)} className="nav__logo" />
            </span>
          )}
        </a>
        <nav ref={navigation} className="nav__links" id="main-navigation" aria-label="Main">
          <div className="nav__items">
            {links.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                className="nav__item"
                style={{ '--nav-order': index } as React.CSSProperties}
                aria-current={active === link.href.slice(1) ? 'location' : undefined}
                onClick={() => closeMenu(link.href)}
              >
                <span>{link.label}</span>
                <Arrow className="nav__item-arrow" />
              </a>
            ))}
          </div>
          <div className="nav__menu-footer">
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noreferrer"
                className="nav__ig"
                aria-label="Instagram"
                onClick={() => closeMenu()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
                <span className="nav__ig-label">Instagram</span>
              </a>
            )}
            <a
              href="#contact"
              className="btn btn--gold nav__mobile-cta"
              onClick={() => closeMenu('#contact')}
            >
              Book a date <Arrow />
            </a>
          </div>
        </nav>
        <a
          href="#contact"
          className="btn btn--gold btn--sm nav__cta"
          onClick={() => closeMenu('#contact')}
        >
          Book a date <Arrow />
        </a>
        <button
          ref={toggle}
          type="button"
          className="nav__toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
