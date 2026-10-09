import type { Payload, User } from 'payload'
import Link from 'next/link'
import React from 'react'

type Props = { payload: Payload; user?: User | null }

const actions = [
  {
    href: '/admin/globals/home',
    title: 'Edit the home page',
    text: 'Hero films, labels, photos, Games background and every home page section.',
  },
  {
    href: '/admin/collections/reels/create',
    title: 'Add a reel',
    text: 'Upload an event video to “Moments”.',
  },
  {
    href: '/admin/collections/media/create',
    title: 'Upload photos & videos',
    text: 'Add files once, then pick them anywhere on the site.',
  },
  {
    href: '/admin/collections/testimonials',
    title: 'Kind words',
    text: 'Add or edit what couples said about you.',
  },
  {
    href: '/admin/globals/site-settings',
    title: 'Header, logo & settings',
    text: 'Header links, logo intro, scroll animations, contact details, WhatsApp and SEO.',
  },
]

/** Shown above the dashboard: quick actions for the most common edits. */
export default async function Welcome({ payload, user }: Props) {
  const fresh = await payload.count({
    collection: 'inquiries',
    where: { status: { equals: 'new' } },
  })
  const name = user && 'email' in user ? String(user.email).split('@')[0] : null

  return (
    <section className="yda-welcome">
      <div className="yda-welcome__head">
        <div>
          <h2>Welcome back{name ? `, ${name}` : ''} ✦</h2>
          <p>What would you like to update today? Changes go live as soon as you click Save.</p>
        </div>
        <a className="yda-welcome__site" href="/" target="_blank" rel="noreferrer">
          View website ↗
        </a>
      </div>

      <div className="yda-welcome__grid">
        <Link
          href="/admin/collections/inquiries?where[status][equals]=new"
          className="yda-card yda-card--enquiries"
        >
          <strong>
            {fresh.totalDocs} new {fresh.totalDocs === 1 ? 'enquiry' : 'enquiries'}
          </strong>
          <span>Reply on WhatsApp, call or email straight from each enquiry.</span>
        </Link>
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="yda-card">
            <strong>{a.title}</strong>
            <span>{a.text}</span>
          </Link>
        ))}
      </div>

      <details className="yda-welcome__tips">
        <summary>Tips for great results</summary>
        <ul>
          <li>
            In headings, wrap a word in <code>*asterisks*</code> to show it in gold italics.
          </li>
          <li>
            Hero films: drag to reorder, use Show this film to hide one, or choose Your upload to
            replace it. Optional phone videos and cover images work with every film.
          </li>
          <li>
            Videos: short MP4 clips. Reels should be vertical (9:16); hero films can have both
            landscape and portrait versions. Keep the original quality when exporting.
          </li>
          <li>
            Photos: JPG or PNG, at least 1200 px wide. Fill in the description for Google and screen
            readers.
          </li>
          <li>
            Drag items in any list (header links, hero films, services, gallery, destinations) to
            change their order.
          </li>
        </ul>
      </details>
    </section>
  )
}
