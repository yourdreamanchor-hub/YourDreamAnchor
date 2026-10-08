'use client'

import React, { useEffect, useState } from 'react'

const links = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Ceremonies' },
  { href: '#moments', label: 'Moments' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#games', label: 'Games' },
  { href: '#love', label: 'Kind words' },
]

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="nav__inner">
        <a href="#top" className="nav__brand" onClick={() => setOpen(false)}>
          {logo ? (
            <img className="nav__logo" src={logo} alt="" width={36} height={36} />
          ) : (
            <span className="nav__mark" aria-hidden>
              ✦
            </span>
          )}
          {brand}
        </a>
        <nav className="nav__links" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          {instagram && (
            <a href={instagram} target="_blank" rel="noreferrer" className="nav__ig">
              Instagram ↗
            </a>
          )}
        </nav>
        <a href="#contact" className="btn btn--gold btn--sm nav__cta" onClick={() => setOpen(false)}>
          Book a date
        </a>
        <button
          className="nav__toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
