'use client'

import { Link } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import React from 'react'

const guides = [
  {
    path: '/admin/collections/city-pages',
    title: 'Mumbai & Bengaluru pages',
    text: 'Edit the opening photo, page text, booking questions and search preview. Matching Event videos appear automatically. Show on website controls the page, its links and the sitemap.',
  },
  {
    path: '/admin/collections/media',
    title: 'Using your media',
    text: 'Upload files here, then choose them in Home page or Event videos. Uploading a file alone does not place it on the website.',
    href: '/admin/globals/home',
    action: 'Place files on the home page',
  },
  {
    path: '/admin/collections/reels',
    title: 'The Moments showcase',
    text: 'Add an uploaded clip or a YouTube link. Set its title, cover and order, then use Show on the home page to publish it.',
  },
  {
    path: '/admin/collections/testimonials',
    title: 'The floating review wall',
    text: 'Keep the original wording and source link. Lower order numbers appear first; Show on website controls visibility.',
  },
  {
    path: '/admin/collections/inquiries',
    title: 'Follow up on bookings',
    text: 'Open an enquiry to reply on WhatsApp, call or email. Update its status and add private notes as you follow up.',
  },
  {
    path: '/admin/collections/users',
    title: 'Admin access',
    text: 'These accounts can sign in and edit the website. Use your Account page to manage your own profile.',
  },
  {
    path: '/admin/globals/home',
    title: 'Editing the home page',
    text: 'Use the section tabs for text, hero films, photos and backgrounds. Event videos and Reviews & comments manage their own collections.',
  },
  {
    path: '/admin/globals/site-settings',
    title: 'Settings across the site',
    text: 'Manage the logo, header, animations, contact details and social links. The SEO tab holds the home page search preview and Google Search Console verification instructions.',
  },
]

export default function SidebarGuide() {
  const pathname = usePathname() || ''
  const guide = guides.find(({ path }) => pathname === path || pathname.startsWith(`${path}/`)) || {
    title: 'Where to start',
    text: 'Home page holds the section text and layout. The library holds your files, event videos and reviews. Save publishes your changes.',
  }

  return (
    <div className="yda-sidebar-guide" aria-label="Help for this section">
      <strong>{guide.title}</strong>
      <p>{guide.text}</p>
      {'href' in guide && (
        <Link href={guide.href} className="yda-sidebar-guide__link">
          {guide.action}
        </Link>
      )}
    </div>
  )
}
