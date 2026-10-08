import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // Lets the test server build into its own folder alongside a running dev server.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  headers: async () =>
    [
      '/media/hero-quality-v1.mp4',
      '/media/hero-quality-v1-poster.jpg',
      ...['sangeet', 'haldi', 'games'].flatMap((film) =>
        ['desktop', 'mobile'].flatMap((device) => [
          `/media/hero-${film}-${device}-v1.mp4`,
          `/media/hero-${film}-${device}-v1-poster.jpg`,
        ]),
      ),
      '/media/games-celebration-v1.webp',
      '/brand/anchor-monogram-v1.svg',
      '/brand/anchor-icon-v1.svg',
      '/brand/anchor-apple-icon-v1.png',
    ].map((source) => ({
      source,
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    })),
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
