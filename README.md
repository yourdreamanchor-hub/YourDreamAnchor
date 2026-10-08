# Your Dream Anchor

Website + admin panel for Akshay R Takalkar, wedding & event anchor.
Built with **Next.js** and **Payload CMS** (free, open source) on **Postgres**.

## Run it locally

Needs Node 20+, pnpm and Postgres.

```bash
pnpm install
createdb yda
cp .env.example .env    # then set PAYLOAD_SECRET
pnpm migrate            # creates the tables
pnpm seed               # loads the demo content from media-import/ (optional)
pnpm dev
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin (the first visit asks you to create the admin account)

## What the admin can change

| In the admin                     | Controls                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| **Pages → Home page**            | Every section: hero video & headline, about, stats, ceremonies, gallery, games, destinations, contact text |
| **Content → Reels**              | The "Moments" videos: title, category, venue, cover image, order, show/hide |
| **Content → Media**              | All uploaded photos and videos                                           |
| **Content → Testimonials**       | Kind words from couples                                                  |
| **Bookings → Inquiries**         | Every enquiry from the website form, with a status (new → contacted → booked) |
| **Settings → Site settings**     | Logo, name, phone, WhatsApp, email, Instagram, SEO                       |

Saved changes appear on the site immediately. In headings, wrap a word in `*asterisks*` to show it in gold italics.

The hero gives the footage most of the screen, with a compact name and role near the bottom.
Under **Pages → Home page → Hero**, edit **Name or title**, **Short role**, and the two action
labels. The supporting line is optional and is currently empty to keep the opening uncluttered.

The white monogram is traced from the supplied `IMG_4572.jpg` reference. Its four exact vector
strokes live in `src/lib/brand.ts`; run `pnpm exec tsx scripts/build-brand-assets.ts` to regenerate
the transparent SVG and dark browser/home-screen icons in `public/brand/`. No generated raster
variant is used. The logo appears in the loading intro, scrolled header and footer. The header
shows `YourDreamAnchor` at the top. Over 40–400 px of scrolling, its actual letter contours
gradually become fifteen adjoining pieces of the monogram; scrolling up reverses the formation
without shifting the navigation links. Reduced-motion visitors get the finished state directly.

`src/lib/brand-morph-data.json` contains the existing Fraunces glyphs and their target geometry;
no font parser or animation dependency runs in the browser. To rebuild it after changing the
typeface, install Python's `fonttools` and `brotli`, build once to download the site's fonts, then
run `python3 scripts/build-brand-morph.py <regular-Latin-Fraunces.woff2>` using the font in
`.next/static/media/`. The contour generator retains the font's copyright and license URL.

The opening draws the monogram once per homepage load and waits for the opening poster/frame
and fonts, with a 2-second wait limit and a 320 ms fade. A CSS fallback also clears the overlay
without JavaScript. Keyboard, pointer or scroll input dismisses it immediately; reduced-motion
visitors, deep links and restored scroll positions bypass it. It never locks scrolling or focus.
Select a different **Settings → Site settings → Logo** upload to use that logo throughout; its
intro uses a simple reveal rather than the original monogram's stroke drawing.

Videos: upload MP4 (H.264), ideally under 20 MB. To shrink one:

```bash
ffmpeg -i input.mp4 -vf "scale='min(720,iw)':-2" -c:v libx264 -crf 28 -maxrate 1200k -bufsize 2400k -c:a aac -b:a 96k -movflags +faststart output.mp4
```

The approved homepage film is bundled in `public/media/hero-quality-v1.mp4` with its matching
poster. It is the reviewed 12-second H.264 export: 1280 × 576, 30 fps, about 7.8 Mbps and 11.7 MB,
without audio. It was re-exported from seconds 4–16 of `media-import/instagram/DeKEPSoRU0I.mp4`
(1080 × 608 source), with Lanczos scaling and CRF 17. This improves compression quality; it is
not native 1080p or an AI upscale. Do not recompress it with the low-bitrate example above.

`src/lib/hero-media.ts` substitutes this export only for the original `hero-loop.mp4` and
`hero-loop-1.mp4` CMS uploads. Selecting a differently named video in the admin uses that upload
and its selected poster normally. The bundled files have versioned names and long-lived caching;
use a new filename and update the resolver and cache paths when replacing the bundled export.

## Changing the content model

Schema changes go through migrations (auto-sync is off):

```bash
pnpm migrate:create my-change   # after editing a collection or global
pnpm migrate                    # apply locally
```

Production applies pending migrations automatically on start-up.

## Checks

```bash
pnpm lint
pnpm test:int   # enquiry rules, rate limit, email alert
pnpm test:e2e   # home page, reel lightbox, privacy page, admin panel
```

## Deploying

Supabase hosts the database and uploaded photos/videos; Vercel hosts the website and the bundled hero film.

1. **Supabase → database.** Project → **Connect** → *Connection string* → **Transaction pooler** (port 6543).
   Fill in your database password → `DATABASE_URL`.
2. **Supabase → storage.**
   - **Storage → New bucket** named `yourdreamanchor`, set to **Public**. Raise its file size limit to 50 MB.
   - **Storage → S3 Configuration**: turn on the S3 connection, note the endpoint and region,
     and **New access key** → `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
   - `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET=yourdreamanchor` and `S3_PUBLIC_URL` are pre-filled in `.env.example`.
3. **Resend** (enquiry emails) → API key → `RESEND_API_KEY`; `NOTIFY_EMAIL` = where alerts go.
4. **Vercel** → import the GitHub repo, paste all the variables above plus `PAYLOAD_SECRET` and
   `NEXT_PUBLIC_SERVER_URL`, set the function region close to the Supabase region, deploy.
   Pending database migrations run automatically on start-up.
5. **Straight after the first deploy, open `/admin` and create the admin account** (until then, anyone could).
6. Load the content into production once, from this machine, with the production values in your shell.
   Use the **Session pooler** URL (port 5432) here, which is better for one-off scripts:
   `DATABASE_URL=… S3_…=… pnpm migrate && pnpm seed`

Spam protection: the form has a hidden honeypot field and allows at most 3 enquiries per visitor per hour
(30 per 10 minutes overall). Only a salted hash of the visitor's IP is stored.

**Free-plan limits to watch (Supabase):** about 5 GB of file downloads a month (roughly a few hundred
visitors watching reels), and projects pause after a week with no activity. If either becomes a problem,
upgrade to Pro or move videos to another S3-compatible store: only the `S3_*` values change.

The seeded testimonials are real comments couples left on @yourdreamanchor's Instagram posts. Ask them before launch whether they're happy to be quoted.
