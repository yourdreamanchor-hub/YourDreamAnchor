/**
 * End-to-end check of the production setup: database, storage upload, public file serving,
 * video streaming and deletion. Prints only pass/fail lines, never secrets.
 *
 *   pnpm verify:production   (reads .env.supabase.local)
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

let failures = 0
const pass = (msg: string) => console.log(`  ✓ ${msg}`)
const fail = (msg: string, err?: unknown) => {
  failures++
  console.log(`  ✗ ${msg}${err ? `: ${err instanceof Error ? err.message : String(err)}` : ''}`)
}

// A 1×1 transparent PNG, small enough to upload and delete instantly.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

console.log('\nDatabase')
const payload = await getPayload({ config })
try {
  const [reels, media, users] = await Promise.all([
    payload.count({ collection: 'reels' }),
    payload.count({ collection: 'media' }),
    payload.count({ collection: 'users' }),
  ])
  pass(`connected; tables exist (reels: ${reels.totalDocs}, media: ${media.totalDocs}, admin users: ${users.totalDocs})`)
} catch (err) {
  fail('could not query the database (did `pnpm migrate` run?)', err)
}

console.log('\nStorage')
const publicUrl = process.env.S3_PUBLIC_URL?.replace(/\/$/, '')
if (!process.env.S3_ACCESS_KEY_ID || !publicUrl) {
  fail('S3_* values are not set, so uploads would go to local disk')
} else {
  const name = `verify-${Date.now()}.png`
  let id: number | undefined
  try {
    const doc = await payload.create({
      collection: 'media',
      data: { alt: 'Setup check (safe to delete)' },
      file: { data: PNG, mimetype: 'image/png', name, size: PNG.length },
    })
    id = doc.id
    pass('uploaded a test file with the access keys')

    if (doc.url?.startsWith(publicUrl)) pass('file URL points at the public bucket')
    else fail(`file URL is ${doc.url}, expected it to start with the bucket's public URL`)

    const res = await fetch(`${publicUrl}/${name}`)
    if (res.ok && res.headers.get('content-type')?.startsWith('image/')) pass('file is publicly readable')
    else fail(`public URL returned ${res.status}; is the bucket set to Public?`)
  } catch (err) {
    fail('upload failed; check S3_ENDPOINT, S3_REGION, S3_BUCKET and the access keys', err)
  } finally {
    if (id) {
      try {
        await payload.delete({ collection: 'media', id })
        // Cache-busting query: Supabase's CDN can keep serving a deleted file for a while.
        const gone = await fetch(`${publicUrl}/${name}?deleted=${Date.now()}`)
        if (gone.status === 404 || gone.status === 400) pass('test file deleted from the bucket')
        else fail(`deleted the record but the file still answers ${gone.status}`)
      } catch (err) {
        fail('could not delete the test file', err)
      }
    }
  }

  const video = await payload.find({ collection: 'media', where: { mimeType: { equals: 'video/mp4' } }, limit: 1 })
  const videoUrl = video.docs[0]?.url
  if (!videoUrl) {
    console.log('  – no videos uploaded yet; run `pnpm content:production` to load them')
  } else {
    const res = await fetch(videoUrl, { headers: { Range: 'bytes=0-99' } })
    if (res.status === 206) pass('videos stream in chunks (needed for Safari/iPhone and seeking)')
    else fail(`video range request returned ${res.status}, expected 206`)
  }
}

console.log(failures ? `\n${failures} check(s) failed.\n` : '\nAll checks passed.\n')
process.exit(failures ? 1 : 0)
