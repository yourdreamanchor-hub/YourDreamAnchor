/**
 * Tests must never touch the live site. Point them at the local database and local file storage,
 * whatever .env says. Imported before dotenv so these values win (dotenv never overrides).
 */
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://localhost:5432/yda'
for (const key of ['S3_BUCKET', 'S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_PUBLIC_URL']) {
  process.env[key] = ''
}
process.env.RESEND_API_KEY = ''
process.env.NEXT_PUBLIC_SERVER_URL = 'http://localhost:3100'
process.env.NEXT_DIST_DIR = '.next-test'

export {}
