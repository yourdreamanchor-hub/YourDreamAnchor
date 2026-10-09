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

## Design demos and previews

The runnable HTML comparisons and previews are saved in `ui-demos/`, with their media and
font licenses. See [the demo instructions](ui-demos/README.md) to open them. The original
dark-and-gold website is the selected design; the two alternative layouts remain archived
for comparison. Hero, Games and scroll previews use the running website on port 3000.

Preview screenshots, temporary CMS snapshots and local font tools are kept locally and
ignored by Git. The production artwork, media, generators and source are versioned.

## What the admin can change

| In the admin                     | Controls                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Website → Home page**          | Hero film sequence, labels and covers, all section text and photos, Games background, gallery, destinations, contact text |
| **Website → City pages**         | Mumbai and Bengaluru page copy, opening photos, booking questions, search titles and descriptions, publish/hide           |
| **Library → Event videos**       | The "Moments" videos: upload or YouTube link, portrait/landscape shape, title, category, venue, cover, order, show/hide   |
| **Library → Media library**      | All uploaded photos and videos, with descriptions, file types, sizes and update dates                                     |
| **Library → Reviews & comments** | Celebration feedback, collaborator praise and community comments with original source links                               |
| **Bookings → Booking enquiries** | Every enquiry from the website form, with a status (new → contacted → booked)                                             |
| **Settings → Site settings**     | Logo, header links and booking button, loading intro and scroll animations, contact, social links, SEO                    |

Saved changes appear on the site immediately. In headings, wrap a word in `*asterisks*` to show it in gold italics.

The sidebar retains Payload's native navigation, account controls and mobile menu. It shows
the site's monogram, a link to view the website, and a short guide specific to the current section.
Uploading a file adds it to the library; select it in Home page or Event videos to use it on the site.

The media table deliberately hides storage internals from its columns and filters. `prefix` is
an optional storage folder, and `_objectKey` is an identifier for direct browser uploads. Both
can be empty on older imported files. Their values and storage hooks remain intact; editors
do not need to fill them in. The same applies to generated URLs and image-size metadata.

The hero gives the footage most of the screen, with a compact name and role near the bottom.
Under **Website → Home page → Hero**, edit **Name or title**, **Short role**, and the two action
labels. The supporting line is optional and is currently empty to keep the opening uncluttered.

**Hero films** is the list actually shown on the website. Drag its rows to reorder them, rename
the film labels, hide a film with **Show this film**, or choose **Your upload** to select a new
landscape MP4. Every row also accepts a custom cover, phone video and phone cover, including the
approved films. An enabled upload row requires a landscape video; image and video pickers reject
the wrong media type. Removing or hiding every film produces a still hero using the fallback
poster. **Automatically play and rotate hero films** controls the arrival behavior; visitors can
always press Play themselves. **Single-video fallback** retains the previous upload for older
content without a film list.

Under **Hero → Below the hero**, edit the celebration labels, reorder them, and choose the section
each label links to. Under **Games → Section background**, choose the gold artwork, upload your
own image, or use a plain dark background. The small labels above section headings are editable too.

Under **Site settings → Header & motion**, edit and reorder header links, change the booking
button and footer note, and switch the logo intro, section entrances or name-to-logo transition
on or off. **Brand → Site logo** chooses the original monogram or an uploaded replacement.
Live Preview stays on the admin's current trusted domain and refreshes after Save.

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
Choose **Settings → Site settings → Brand → Site logo → Your uploaded logo** to use a replacement throughout; its
intro uses a simple reveal rather than the original monogram's stroke drawing.

To add a YouTube film, open **Library → Event videos → Create**, choose **YouTube video**, paste the
video link and choose **Portrait** or **Landscape** to match the footage. Add a title and category,
set its order, then save. YouTube supplies the cover automatically; an uploaded cover overrides it.
Use **Show on the home page** to hide a film. Uploaded clips and their existing covers remain
editable in the same collection. Change the channel link under **Site settings → Social**.
The verified starting selection comes from [Akshay Takalkar’s channel](https://www.youtube.com/@akshaytakalkarr):
Harshita Gupta & Shrey Chabbra’s haldi, Tarika & Dhruv’s wedding, and the sangeet/haldi/carnival
showcase. Their embeds load only after a visitor clicks, use YouTube’s privacy-enhanced domain,
and are removed when the viewer closes or switches films. Every YouTube film also links to its
original watch page. YouTube controls available playback quality; these films are not re-encoded.

Under **Library → Reviews & comments**, edit a comment's wording, author, event label, social handle and
original comment link. **Feedback from** controls the Celebrations, Collaborators or Community
filter. **Show on website** hides an entry, and **Order** determines its position; the first three
lead the three columns of the floating review wall. Every visible comment participates in the
loop, with no twelve-comment limit. **Read all** opens the complete still layout, where visitors
can expand long quotes. Source links stay on the selected platform and do not load social embeds.
The wall pauses on hover, touch, keyboard focus, when off screen or in a hidden tab; visitors can
also pause it explicitly. Reduced motion and **Site settings → Header & Motion → Animate sections
as visitors scroll** being off both show the complete still layout. Short filtered collections
also use the still layout. Phones use one comfortable column, tablets two and desktops three.

The starting selection contains 59 original comments: 13 celebration comments, 7 collaborator
comments and 39 community comments. The three existing couple quotes are matched and attributed
in place; an editor's changed text, custom photos, event labels and order are preserved. Other
comments are added only once by their source IDs. Section wording stays editable under Home page.
The complete collection is saved in `outputs/social-reviews-20261009/`, with source and coverage
details. It contains the comments collected from 68 Instagram posts and 26 YouTube videos, not
every comment in the accounts' history; some replies and additional comments were not loaded.

Videos: upload MP4 (H.264), ideally under 20 MB. To shrink one:

```bash
ffmpeg -i input.mp4 -vf "scale='min(1280,iw)':-2" -c:v libx264 -crf 20 -an -movflags +faststart output.mp4
```

The approved homepage film is bundled in `public/media/hero-quality-v1.mp4` with its matching
poster. It is the reviewed 12-second H.264 export: 1280 × 576, 30 fps, about 7.8 Mbps and 11.7 MB,
without audio. It was re-exported from seconds 4–16 of `media-import/instagram/DeKEPSoRU0I.mp4`
(1080 × 608 source), with Lanczos scaling and CRF 17. This improves compression quality; it is
not native 1080p or an AI upscale. Do not recompress it with the low-bitrate example above.

The film list exposes this export as **Wedding — approved film**. An explicit **Your upload**
selection uses its actual file and chosen cover without substituting another recording.
The legacy single-video fallback substitutes the approved export for `hero-loop.mp4` and
`hero-loop-1.mp4` only. The bundled files have versioned names and long-lived caching;
use a new filename and update the resolver and cache paths when replacing the bundled export.

The approved opener now leads a four-film sequence: Wedding, Sangeet, Haldi and Games. The three
additional films have separate landscape and portrait crops, matching posters, 12-second lengths,
H.264 encoding at CRF 17 and no audio. Source ranges, crop rectangles and export sizes are recorded
in `design/hero-films.json`. Run `node scripts/build-hero-films.mjs` to reproduce them when the
original local footage is available. They preserve source quality; reframing and scaling do not
create missing detail or make a recording native 1080p.

`HeroFilms` starts with only the opening video. It requests another film near the end or when a
visitor chooses one, holds the current picture until a decoded frame is ready, and dissolves over
700 ms. The outgoing video is removed afterward. The sequence pauses out of view and in a hidden
tab, offers manual film selection and a pause button, and holds a poster by default for reduced
motion or data saver. Keyboard focus on its controls keeps the chosen film from rotating. A custom
film list can mix the approved films with your own uploads, in any order.

## Search visibility and city pages

The public search address is always `https://yourdreamanchor.com`, independent of development
URLs and Vercel aliases. Each public page has its own canonical, title, description, social
preview and indexing directive. Production permits crawling, including uploaded image files;
development and Vercel previews use noindex. Payload admin pages also send noindex in their
HTML and response headers. Robots points to the public sitemap rather than localhost.

The sitemap contains the home page, privacy page and published city pages, with real CMS
modification dates and photo entries. Saving CMS content invalidates the site and sitemap.
Organization, Person, WebSite, WebPage, Service and city breadcrumbs describe the actual
business. Social comments are not converted into ratings or review stars. No office address
is inferred from a city or an event venue.

**Website → City pages** controls `/wedding-anchor-mumbai` and `/wedding-anchor-bengaluru`.
Edit the opening text, photo/caption, section headings, planning copy, booking questions and
search preview. Opening button labels share the editable Home page → Hero labels. Leave the
opening photo empty to use that city’s photo from Home page →
Destinations. Services come from Home page; featured Event videos appear when their **Location**
contains Mumbai, Bengaluru or Bangalore. A film title mentioning a city does not qualify it.
Turn off **Show on website** to remove the page from public access, the sitemap and site links.
City forms prefill the city while keeping it editable. Opening photo and home photos use the
real generated image sizes, explicit dimensions and descriptions. The first hero cover is
preloaded without changing the approved footage.

Run `pnpm verify:seo` for a read-only public HTTP audit. To check a local production build:
`SEO_AUDIT_ORIGIN=http://localhost:3100 pnpm verify:seo`. For a development/preview build,
also set `SEO_AUDIT_PREVIEW=1`. An optional file argument saves the public audit report.
These checks verify output and discovery; they do not measure rankings or field Core Web Vitals.

## Connect Google search tools

1. Open [Google Search Console](https://search.google.com/search-console) with the business
   owner’s Google account. For the quickest setup, add the **URL-prefix** property
   `https://yourdreamanchor.com/` and choose **HTML tag** verification. Copy only the tag’s
   `content` value into **Settings → Site settings → SEO → Google Search Console verification
   token**, then Save. Return to Google and click Verify. Keep the token saved afterward.
   Alternatively, a **Domain** property for `yourdreamanchor.com` verifies through the DNS
   provider and covers protocol/subdomain variations. See [Google’s ownership instructions](https://support.google.com/webmasters/answer/9008080).
2. Submit `https://yourdreamanchor.com/sitemap.xml` under Search Console → Sitemaps.
   Inspect the home page and both city pages and request indexing. Review Page indexing,
   Performance and Core Web Vitals as data becomes available.
3. Create or claim [Google Business Profile](https://www.google.com/business/) with the actual
   business name, public phone and website. Choose accurate services/categories and complete
   Google’s verification. If customers are served at event venues rather than a staffed public
   office, use the appropriate service-area setup and hide a residential address. Do not create
   fictitious Mumbai/Bengaluru offices. See [Google’s address guidance](https://support.google.com/business/answer/2853879).
4. Add real event photos and request honest feedback from actual couples. Keep contact details
   consistent across the website, profile, Instagram and YouTube. Useful venue/planner links
   and new event stories can build evidence over time.

The starting searches are **wedding anchor in Mumbai**, **event anchor in Mumbai**, **wedding
anchor in Bengaluru**, **event anchor in Bengaluru**, and the natural Bangalore/emcee variants.
Track impressions, clicks and relevant enquiries before expanding the content. Google controls
indexing and ranking; implementation does not guarantee a position. Google describes the
importance of useful content in its [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide),
and relevance, distance and prominence in its [local ranking guidance](https://support.google.com/business/answer/7091).

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

1. **Supabase → database.** Project → **Connect** → _Connection string_ → **Transaction pooler** (port 6543).
   Fill in your database password → `DATABASE_URL`.
2. **Supabase → storage.**
   - **Storage → New bucket** named `yourdreamanchor`, set to **Public**. Raise its file size limit to 50 MB.
   - **Storage → S3 Configuration**: turn on the S3 connection, note the endpoint and region,
     and **New access key** → `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
   - `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET=yourdreamanchor` and `S3_PUBLIC_URL` are pre-filled in `.env.example`.
3. **Resend** (enquiry emails) → API key → `RESEND_API_KEY`; `NOTIFY_EMAIL` = where alerts go.
4. **Vercel** → import the GitHub repo, paste all the variables above plus `PAYLOAD_SECRET` and
   `NEXT_PUBLIC_SERVER_URL=https://yourdreamanchor.com`, set the function region close to the Supabase region, deploy.
   Pending database migrations run automatically on start-up.
5. **Straight after the first deploy, open `/admin` and create the admin account** (until then, anyone could).
6. Load the content into production once, from this machine, with the production values in your shell.
   Use the **Session pooler** URL (port 5432) here, which is better for one-off scripts:
   `DATABASE_URL=… S3_…=… pnpm migrate && pnpm seed`

Payload accepts login cookies on exact trusted origins. `src/lib/site-origin.ts` prevents a
Vercel deployment from inheriting `localhost` as its public address, trusts the canonical site
and the deployment's own aliases, and supports explicit additional domains through the
comma-separated `PAYLOAD_ALLOWED_ORIGINS`. Keep production's public URL set correctly;
do not use a wildcard allowlist or public update access to resolve an admin save error.
The CMS-controls migration preserves existing content, carries the currently visible films
into the editor, and retains an explicitly selected custom video or replacement logo.

Spam protection: the form has a hidden honeypot field and allows at most 3 enquiries per visitor per hour
(30 per 10 minutes overall). Only a salted hash of the visitor's IP is stored.

**Free-plan limits to watch (Supabase):** about 5 GB of file downloads a month (roughly a few hundred
visitors watching reels), and projects pause after a week with no activity. If either becomes a problem,
upgrade to Pro or move videos to another S3-compatible store: only the `S3_*` values change.

Imported feedback keeps its original wording, author and source link. Community comments are
shown as public feedback without assigning customer status or a star rating.
