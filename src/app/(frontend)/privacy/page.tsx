import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { getSiteData } from '@/lib/data'

export const revalidate = 3600

export const metadata: Metadata = { title: 'Privacy policy · Your Dream Anchor' }

export default async function PrivacyPage() {
  const { settings } = await getSiteData()
  const contact = settings.email || settings.phone || 'the contact details on our home page'

  return (
    <main className="legal">
      <div className="container legal__inner">
        <Link href="/" className="link">
          ← Back to {settings.brandName}
        </Link>
        <h1 className="h2">Privacy policy</h1>
        <p className="muted">Last updated: October 2026</p>

        <h2>What we collect</h2>
        <p>
          When you send an enquiry through this website, we collect the details you enter: your name,
          phone number, email address (optional), the type and date of your event, the city or venue,
          and your message.
        </p>

        <h2>How we use it</h2>
        <p>
          We use these details only to reply to your enquiry, check availability and plan your event.
          We do not sell your details or use them for unrelated marketing.
        </p>

        <h2>Who can see it</h2>
        <p>
          Your enquiry is stored securely and can be seen only by {settings.anchorName} and the team
          managing bookings. We use trusted service providers to host this website and send email
          notifications; they process data only on our behalf.
        </p>

        <h2>How long we keep it</h2>
        <p>
          We keep enquiries for as long as needed to respond and manage a booking, and delete them on
          request.
        </p>

        <h2>Your choices</h2>
        <p>
          You can ask us to see, correct or delete the details you shared at any time by contacting{' '}
          {contact}.
        </p>

        <h2>Analytics</h2>
        <p>
          We use privacy-friendly, cookie-free analytics to count page visits. It does not identify you
          personally.
        </p>
      </div>
    </main>
  )
}
