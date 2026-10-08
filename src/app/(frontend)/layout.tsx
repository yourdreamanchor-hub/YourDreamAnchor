import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope } from 'next/font/google'
import React from 'react'

import { LivePreviewListener } from '@/components/site/LivePreviewListener'
import { getSiteData, mediaUrl } from '@/lib/data'
import { brandAppleIconUrl, brandIconUrl, brandLogo, monogramUrl } from '@/lib/brand'
import './styles.css'

const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'opsz'],
  variable: '--font-display',
})
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' })

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteData()
  const image = mediaUrl(settings.shareImage, 'wide')
  const logo = brandLogo(mediaUrl(settings.logo))
  return {
    icons:
      logo === monogramUrl
        ? { icon: brandIconUrl, apple: brandAppleIconUrl }
        : { icon: logo, apple: logo },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
    title: settings.metaTitle || settings.brandName,
    description: settings.metaDescription || undefined,
    openGraph: image ? { images: [image] } : undefined,
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
