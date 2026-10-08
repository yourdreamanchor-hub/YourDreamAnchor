/**
 * Loads the demo content (reels, stills, home page copy) into the CMS.
 *
 *   pnpm seed          # only seeds an empty database
 *   SEED_FRESH=1 pnpm seed  # wipes reels, testimonials and media first
 *
 * Expects the processed files from media-import/web, media-import/stills and media-import/photos.
 */
import path from 'path'
import { getPayload } from 'payload'

import config from './payload.config'

const root = path.resolve(process.cwd(), 'media-import')
const web = (f: string) => path.join(root, 'web', f)
const still = (f: string) => path.join(root, 'stills', f)
const photo = (f: string) => path.join(root, 'photos', `${f}.jpg`)

const payload = await getPayload({ config })
const fresh = process.env.SEED_FRESH === '1'

const existing = await payload.count({ collection: 'reels' })
if (existing.totalDocs > 0 && !fresh) {
  payload.logger.info('Reels already exist — skipping. Run with SEED_FRESH=1 to reseed.')
  process.exit(0)
}

if (fresh) {
  for (const collection of ['reels', 'testimonials', 'media'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }
}

async function upload(filePath: string, alt: string) {
  const doc = await payload.create({ collection: 'media', data: { alt }, filePath })
  return doc.id
}

payload.logger.info('Uploading photos…')
const img = {
  logo: await upload(still('logo-avatar.jpg'), 'Akshay R Takalkar'),
  portrait: await upload(photo('DTVrrtZko90_01'), 'Akshay R Takalkar hosting with a microphone'),
  anchor: await upload(photo('DXwrp41ElaJ_03'), 'Akshay singing to the crowd'),
  haldi: await upload(photo('DRZoPOqGP-P_13'), 'Akshay dancing with the haldi crowd in yellow'),
  sangeet: await upload(photo('DTNpIg_mJf1_10'), 'Family performance on a sangeet stage'),
  wedding: await upload(photo('DPErTR7Ei0I_01'), 'Akshay under a floral wedding mandap by the sea'),
  games: await upload(photo('DLb6BlzySwy_04'), 'Bride playing a game hosted by Akshay'),
  reception: await upload(photo('DT7TB16Emwx_01'), 'Akshay with the couple at a reception'),
  mumbai: await upload(photo('Da2ycMRmOdr_01'), 'Akshay at St. Regis, Mumbai'),
  jaipur: await upload(photo('DWcBaABkd6V_01'), 'Akshay at Anantara, Jaipur'),
  mandawa: await upload(photo('DDh5NW9tFVv_01'), 'Akshay at Castle Mandawa, Rajasthan'),
  bengaluru: await upload(photo('DXyU-N_mE4v_03'), 'Mehendi celebration in Bengaluru'),
  corbett: await upload(still('dest-corbett.jpg'), 'Forest wedding decor at Jim Corbett'),
}

const galleryPhotos: [string, string, string?][] = [
  ['DCjuQfZNNbg_01', 'Red-carpet entry at a Bollywood night', 'Bollywood night'],
  ['DTVrrtZko90_05', 'Guests cheering at a haldi'],
  ['DTNpIg_mJf1_08', 'Sangeet games under neon lights', 'Sangeet games'],
  ['DbD0IuzmI6d_01', 'Akshay hosting a haldi crowd'],
  ['DPnnQ__ElrM_03', 'Akshay with a sports team at a corporate event', 'Corporate events'],
  ['DWbLz6xmN7W_03', 'Akshay dancing with guests at a sangeet'],
  ['DRZoPOqGP-P_11', 'Akshay singing with a young guest'],
  ['DTDMgSNmKKP_01', 'Akshay at a hilltop venue'],
  ['DWVerFgmKt5_01', 'Akshay on the mic at a celebration'],
  ['DWbLz6xmN7W_01', 'Family singing along with Akshay'],
  ['DXwrp41ElaJ_05', 'Akshay hosting a wedding game'],
  ['DSp54IBEjCs_01', 'Akshay at a poolside venue'],
]
const gallery = []
for (const [file, alt, caption] of galleryPhotos) {
  gallery.push({ image: await upload(photo(file), alt), caption })
}

payload.logger.info('Uploading videos…')
const heroVideo = await upload(web('hero-loop.mp4'), 'Wedding highlights')
const heroPoster = await upload(web('hero-poster.jpg'), 'Wedding highlights')
const gamesVideo = await upload(web('games-loop.mp4'), 'Guess-the-Bollywood-movie game')
const gamesPoster = await upload(web('games-poster.jpg'), 'Guess-the-Bollywood-movie game')

const reels = [
  {
    id: 'DeKEPSoRU0I',
    title: 'A happily ever after',
    category: 'wedding',
    location: 'Shoonya Farm Retreat, Bengaluru',
    caption: 'A wedding day under open skies, from the first look to the last dance.',
  },
  {
    id: 'Dcq1M-lR8hz',
    title: 'A night where love took centre stage',
    category: 'sangeet',
    location: 'Golden Amoon Resort, Bengaluru',
    caption: 'Family performances, fireworks and a dance floor that never emptied.',
  },
  {
    id: 'DeBzehSRgD4',
    title: 'Haldi, but make it a full-blown celebration',
    category: 'haldi',
    location: 'MG Magnus, Bengaluru',
    caption: 'Crazy energy, nonstop dancing and the kind of wedding madness we live for.',
  },
  {
    id: 'DbvhBTXBA2d',
    title: 'Haldi above the clouds',
    category: 'haldi',
    location: 'St. Regis, Mumbai',
    caption: 'Above the city noise, right where the clouds meet the celebrations.',
  },
  {
    id: 'C7ZxSazKZmH',
    title: 'Fastest Finger First',
    category: 'games',
    location: 'Miraya Greens, Bengaluru',
    caption: 'Team bride vs team groom, one table, zero chill.',
  },
  {
    id: 'DdHBCWWxPrH',
    title: 'Four celebrations in the forest',
    category: 'wedding',
    location: 'Jim Corbett, Uttarakhand',
    caption: 'Four functions surrounded by nature, beautiful people and endless laughter.',
  },
  {
    id: 'DdBqj6mxqLj',
    title: 'Sunshine & blessings',
    category: 'haldi',
    location: 'Tropical Retreat, Igatpuri',
    caption: 'Balloons, marigolds and a whole lot of haldi magic.',
  },
  {
    id: 'DCy1D-3o_Kf',
    title: 'Guess the Bollywood movie',
    category: 'games',
    location: 'Shoonya Farm Retreat, Bengaluru',
    caption: 'Bollywood titles translated into English. Guests had to shout the original.',
  },
  {
    id: 'DbTWkk1RiP4',
    title: 'From Mumbai to the hills of Dehradun',
    category: 'haldi',
    location: 'Le Méridien, Dehradun',
    caption: 'They found love in Mumbai and celebrated it in the hills.',
  },
] as const

for (const [i, r] of reels.entries()) {
  payload.logger.info(`Reel ${i + 1}/${reels.length}: ${r.title}`)
  const video = await upload(web(`${r.id}.mp4`), r.title)
  const poster = await upload(web(`${r.id}-poster.jpg`), r.title)
  await payload.create({
    collection: 'reels',
    data: {
      title: r.title,
      category: r.category,
      location: r.location,
      caption: r.caption,
      video,
      poster,
      instagramUrl: `https://www.instagram.com/reel/${r.id}/`,
      featured: true,
      order: i,
    },
  })
}

// Real comments left by couples on @yourdreamanchor's Instagram posts (emojis removed, wording kept).
const testimonials = [
  {
    quote:
      'The best of the best. Couldn’t have asked for anyone other than Your Dream Anchor for our big day.',
    name: 'Naina',
    event: 'Bride · Wedding at Shoonya Farm Retreat, Bengaluru',
  },
  {
    quote:
      'Thank you so much for hosting both our events. You kept everyone entertained and engaged all the time. Our guests had a lot of fun!',
    name: 'Aanchal',
    event: 'Bride · Sangeet & Haldi',
  },
  {
    quote: '“Our dream anchor” for our big day. The Haldi was lit because of you!',
    name: 'Hari',
    event: 'Groom · Haldi & Wedding, Bengaluru',
  },
]
for (const [i, t] of testimonials.entries()) {
  await payload.create({ collection: 'testimonials', data: { ...t, order: i } })
}

await payload.updateGlobal({
  slug: 'site-settings',
  data: {
    brandName: 'Your Dream Anchor',
    anchorName: 'Akshay R Takalkar',
    role: 'Wedding & Event Anchor',
    baseCity: 'Mumbai · Bengaluru · Destination',
    instagram: 'https://www.instagram.com/yourdreamanchor/',
    instagramHandle: '@yourdreamanchor',
    logo: img.logo,
    shareImage: heroPoster,
  },
})

await payload.updateGlobal({
  slug: 'home',
  data: {
    hero: {
      eyebrow: 'Wedding & Event Anchor',
      headline: 'Every celebration deserves a *voice.*',
      subheadline:
        'Akshay R Takalkar hosts haldis, sangeets and weddings across India with games, music and the kind of energy that keeps every family on the dance floor.',
      video: heroVideo,
      poster: heroPoster,
      primaryLabel: 'Check your date',
      secondaryLabel: 'Watch the moments',
    },
    marquee: [
      'Haldi',
      'Mehendi',
      'Sangeet',
      'Wedding',
      'Reception',
      'New game alert',
      'Mumbai',
      'Bengaluru',
      'Destination weddings',
    ].map((text) => ({ text })),
    about: {
      kicker: 'Meet your anchor',
      heading: 'The mic is just the start. The *crowd* is the show.',
      body: 'Hi, I’m Akshay. I host the moments between the moments: the haldi that turns into a dance-off, the sangeet where the shy uncle steals the show, the wedding where every family feels like one.\n\nEvery event gets its own script, games built around the couple, and a mic in one hand (and now and then a guitar in the other). From skyline ballrooms in Mumbai to palaces in Rajasthan, my job is simple: make your people feel it.',
      portrait: img.portrait,
      signature: '— Akshay',
    },
    stats: [
      { value: '10+', label: 'Years behind the mic' },
      { value: '8+', label: 'Cities, from Mumbai to Mandawa' },
      { value: '19K', label: 'Instagram family' },
    ],
    servicesHeading: 'One voice, *every* ceremony.',
    services: [
      {
        title: 'Haldi & Mehendi',
        description: 'Sunshine, songs and silly games. Turmeric-coloured chaos, perfectly hosted.',
        image: img.haldi,
        accent: 'haldi',
      },
      {
        title: 'Sangeet nights',
        description: 'Run of show, family performances, surprise acts and a floor that never empties.',
        image: img.sangeet,
        accent: 'violet',
      },
      {
        title: 'Weddings & varmala',
        description: 'Graceful through the rituals, electric through the entries.',
        image: img.wedding,
        accent: 'rani',
      },
      {
        title: 'Games & ice-breakers',
        description: 'Original wedding games that turn two families into one loud team.',
        image: img.games,
        accent: 'gold',
      },
      {
        title: 'Receptions & cocktails',
        description: 'Toasts, couple intros and a polished flow for your biggest evening.',
        image: img.reception,
        accent: 'rani',
      },
      {
        title: 'Live music & sing-alongs',
        description: 'Guitar, mic and a crowd that knows every word.',
        image: img.anchor,
        accent: 'mehendi',
      },
    ],
    momentsHeading: 'Moments we made *loud.*',
    momentsIntro:
      'Real celebrations, straight from the dance floor. Tap any reel to watch with sound.',
    games: {
      kicker: 'New game alert',
      heading: 'Games your guests will *fight* to win.',
      body: 'Every event gets games designed around the couple and the crowd. Quick to explain, loud to play and impossible to sit out.',
      video: gamesVideo,
      poster: gamesPoster,
      list: [
        'Fastest Finger First',
        'Guess the Bollywood movie',
        'Team bride vs team groom',
        'Couple trivia',
        'Ring-toss challenges',
      ].map((name) => ({ name })),
    },
    destinationsHeading: 'From skyline ballrooms to *palace* courtyards.',
    destinations: [
      { city: 'Mumbai', venue: 'St. Regis', image: img.mumbai },
      { city: 'Jaipur', venue: 'Anantara', image: img.jaipur },
      { city: 'Mandawa', venue: 'Castle Mandawa', image: img.mandawa },
      { city: 'Bengaluru', venue: 'Golden Amoon · MG Magnus', image: img.bengaluru },
      { city: 'Jim Corbett', venue: 'Uttarakhand', image: img.corbett },
    ],
    galleryHeading: 'Behind the *mic.*',
    gallery,
    testimonialsHeading: 'What the families *said.*',
    contact: {
      heading: 'Is your date still *open?*',
      body: 'Tell us about your celebration. We usually reply within a day with availability and a plan.',
      successMessage: 'Thank you! We’ll call you within a day.',
    },
  },
})

payload.logger.info('Seed complete.')
process.exit(0)
