import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Reels } from './collections/Reels'
import { Testimonials } from './collections/Testimonials'
import { Inquiries } from './collections/Inquiries'
import { HomePage } from './globals/HomePage'
import { SiteSettings } from './globals/SiteSettings'
import { migrations } from './migrations'
import { cmsOrigins, siteOrigin } from './lib/site-origin'
import { mediaAdmin } from './lib/media-admin'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const env = process.env

// S3-compatible storage (Supabase Storage in production). Without these, uploads go to ./media locally.
const s3Enabled = Boolean(env.S3_BUCKET && env.S3_ENDPOINT && env.S3_ACCESS_KEY_ID)
const s3PublicUrl = env.S3_PUBLIC_URL?.replace(/\/$/, '')

export default buildConfig({
  serverURL: siteOrigin(env),
  csrf: cmsOrigins(env),
  cors: cmsOrigins(env),
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' · Your Dream Anchor',
    },
    components: {
      graphics: {
        Logo: '/components/admin/Brand#Logo',
        Icon: '/components/admin/Brand#Icon',
      },
      beforeDashboard: ['/components/admin/Welcome'],
      beforeNavLinks: ['/components/admin/SidebarHeader'],
      afterNavLinks: ['/components/admin/SidebarGuide'],
    },
    // Local development only: signs in the throwaway admin from .env.admin-test.local.
    autoLogin:
      process.env.NODE_ENV !== 'production' && env.ADMIN_TEST_EMAIL && env.ADMIN_TEST_PASSWORD
        ? { email: env.ADMIN_TEST_EMAIL, password: env.ADMIN_TEST_PASSWORD }
        : false,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Reels, Media, Testimonials, Inquiries, Users],
  globals: [HomePage, SiteSettings],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL || '' },
    // Schema changes go through migrations (pnpm migrate:create), never auto-push.
    push: false,
    prodMigrations: migrations,
  }),
  email: env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: env.RESEND_API_KEY,
        defaultFromAddress: env.EMAIL_FROM || 'onboarding@resend.dev',
        defaultFromName: 'Your Dream Anchor',
      })
    : undefined,
  sharp,
  plugins: [
    s3Storage({
      enabled: s3Enabled,
      alwaysInsertFields: true,
      collections: {
        media: s3PublicUrl
          ? {
              // Serve files straight from the bucket's public URL (supports video range requests, no server hop).
              disablePayloadAccessControl: true,
              generateFileURL: ({ filename, prefix }) =>
                [s3PublicUrl, prefix, filename].filter(Boolean).join('/'),
            }
          : true,
      },
      bucket: env.S3_BUCKET || '',
      config: {
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION || 'auto',
        // Supabase Storage (and most non-AWS providers) need path-style bucket URLs.
        forcePathStyle: true,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: env.S3_SECRET_ACCESS_KEY || '',
        },
      },
      // Uploads go browser → bucket directly, so large videos skip Vercel's 4.5 MB request limit.
      clientUploads: true,
    }),
    mediaAdmin,
  ],
})
