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

Videos: upload MP4 (H.264), ideally under 20 MB. To shrink one:

```bash
ffmpeg -i input.mp4 -vf "scale='min(720,iw)':-2" -c:v libx264 -crf 28 -maxrate 1200k -bufsize 2400k -c:a aac -b:a 96k -movflags +faststart output.mp4
```

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

Supabase hosts the database **and** the photos/videos; Vercel hosts the website.

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

The seeded testimonials are **samples**. Replace them with real reviews before launch.
