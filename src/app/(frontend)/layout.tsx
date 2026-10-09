import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope } from 'next/font/google'
import React from 'react'

import { LivePreviewListener } from '@/components/site/LivePreviewListener'
import { getSiteSettings, mediaUrl } from '@/lib/data'
import { brandAppleIconUrl, brandIconUrl, monogramUrl } from '@/lib/brand'
import { selectedLogo } from '@/lib/site-content'
import { pageMetadata } from '@/lib/seo'
import './styles.css'

const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'opsz'],
  variable: '--font-display',
})
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const logo = selectedLogo(settings, mediaUrl(settings.logo))
  return {
    ...pageMetadata(settings),
    icons:
      logo === monogramUrl
        ? { icon: brandIconUrl, apple: brandAppleIconUrl }
        : { icon: logo, apple: logo },
  }
}

export const viewport: Viewport = { themeColor: '#0d0812' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        {children}
        <LivePreviewListener />
        <Analytics />
      </body>
    </html>
  )
}
