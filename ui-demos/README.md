# Your Dream Anchor UI demos

Two archived visual proposals for comparison, plus previews of the selected original design.
The original dark-and-gold website is the chosen direction. The logo, motion, Games background
and four-film hero are implemented in the Next.js/Payload website.

## Current website previews

Run `pnpm dev` from the project directory for the website on port 3000, and start the static
preview server using the command below. These pages display the actual website and CMS content:

- [Hero films](http://localhost:4173/hero-films-preview.html) — desktop and phone views of Wedding, Sangeet, Haldi and Games.
- [Games background](http://localhost:4173/games-preview.html) — desktop, phone and full-section views.
- [Scroll motion](http://localhost:4173/scroll-preview.html) — reveals, navigation and the celebration links.

The actual website previews include the real booking form. The archived design proposals use
local enquiry previews that send nothing.

`logo-motion.html` is a standalone, enlarged demo of the wordmark becoming the monogram.
Regenerate it from the current brand geometry with `pnpm exec tsx ui-demos/generate-logo-preview.ts`.
`video-quality.html` compares the earlier lightweight export with the approved source export;
the earlier export is retained only for the comparison.

## Original design with polished motion

Run `pnpm dev` from the project directory, then open `scroll-preview.html`, or visit [the live website](http://localhost:3000/).

The preview switches between a 1440px desktop and a 390px phone. Scroll inside it to see the photo reveals, short card sequences, and active section navigation. **View hero strip** jumps to the new, stationary celebration and destination links beneath the hero. **Replay from the top** reloads the site to replay the entrances. This preview uses the actual website, including its booking form and CMS content, and needs the local Next.js server running on port 3000.

With the static preview server below running, open [the motion preview](http://localhost:4173/scroll-preview.html).

## Open the demos

Double-click `index.html` to compare both designs, or open either page directly:

- `01-warm-editorial.html` — **The Wedding Edit**, warm ivory, wine and forest green.
- `02-cinematic.html` — **After Hours**, warm charcoal, champagne, and an opening film.

Keep the `assets` folder next to the HTML files. The two design proposals are included locally; no install, build, account, database, or internet connection is needed to view them. Instagram, WhatsApp and telephone links use the existing site's public contact details and require their usual apps/connectivity.

If your browser restricts local embedded pages, run a simple server from the project directory:

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory ui-demos
```

Then open http://localhost:4173/ . Stop it with Ctrl+C.

## Things to try

- Compare the desktop and 390px phone views in `index.html`.
- Use the ceremony filters and open a reel. Close it with the close button or Escape.
- Use a ceremony's enquiry arrow to preselect that celebration.
- In After Hours, enter a date and city at the top; these carry into the enquiry form.
- Fill the enquiry form and choose **Preview my enquiry** to see a local confirmation. No data is sent or saved, and availability is not checked.
- Pause or play After Hours' background film. Reduced motion preferences keep it paused by default.
- On phones, use the navigation menu and persistent date enquiry button.

## Content and assets

Photos, reel posters, videos, public contact details, service descriptions and couple comments come from the existing project, primarily `src/seed.ts` and the local `media` directory. Some display copy has been shortened for the proposed layouts. No new ratings, client logos, statistics, or availability claims have been added.

Local font files reuse the current site's Fraunces (roman and italic) and Manrope. Font license files are bundled in `assets`.

The two alternative layouts are review prototypes. Before production use, keep the existing CMS configuration, privacy route, validation, spam protection and inquiry delivery flow, and replace the local preview submission with the real inquiry API.

The authored HTML, scripts, bundled assets and font licenses are versioned. `previews/`,
`tools/` and temporary `*-before-*.json` CMS snapshots are local working files ignored by Git.
