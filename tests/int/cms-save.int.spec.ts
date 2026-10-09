// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { getPayload, JWTAuthentication, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@/payload.config'
import type { Home, SiteSetting, User } from '@/payload-types'
import { cmsOrigins } from '@/lib/site-origin'
import { getSiteData } from '@/lib/data'

let payload: Payload
let home: Home
let settings: SiteSetting
let user: User
let token: string
const createdReels: number[] = []
const createdTestimonials: number[] = []

describe('authenticated CMS saving', () => {
  beforeAll(async () => {
    if (!['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
      throw new Error('CMS save tests require a local database.')
    }
    payload = await getPayload({ config: await config })
    home = await payload.findGlobal({ slug: 'home', depth: 0 })
    settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    const password = randomUUID()
    user = await payload.create({
      collection: 'users',
      data: { email: `cms-${randomUUID()}@example.test`, password },
    })
    const login = await payload.login({
      collection: 'users',
      data: { email: user.email, password },
    })
    token = login.token!
  }, 30000)

  afterAll(async () => {
    if (home) await payload.updateGlobal({ slug: 'home', data: home })
    if (settings) await payload.updateGlobal({ slug: 'site-settings', data: settings })
    for (const id of createdReels) await payload.delete({ collection: 'reels', id })
    for (const id of createdTestimonials) await payload.delete({ collection: 'testimonials', id })
    if (user) await payload.delete({ collection: 'users', id: user.id })
    if (payload) await payload.destroy()
  }, 30000)

  it('accepts the real login cookie on the live origin and rejects a foreign origin', async () => {
    const previous = payload.config.csrf
    const authenticate = (origin: string) =>
      JWTAuthentication({
        payload,
        headers: new Headers({
          Cookie: `${payload.config.cookiePrefix}-token=${token}`,
          Origin: origin,
          DisableAutologin: 'true',
        }),
      })
    try {
      payload.config.csrf = ['http://localhost:3000']
      expect((await authenticate('https://yourdreamanchor.com')).user).toBeNull()
      payload.config.csrf = cmsOrigins({
        NODE_ENV: 'production',
        VERCEL: '1',
        NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
      })
      expect((await authenticate('https://yourdreamanchor.com')).user?.id).toBe(user.id)
      expect((await authenticate('https://yourdreamanchor.com.attacker.example')).user).toBeNull()
    } finally {
      payload.config.csrf = previous
    }
  })

  it('refuses saves without a logged-in editor', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'home',
        overrideAccess: false,
        data: { hero: { ...home.hero, headline: 'Unauthorized' } },
      }),
    ).rejects.toThrow()
    await expect(
      payload.updateGlobal({
        slug: 'site-settings',
        overrideAccess: false,
        data: { bookingLabel: 'Unauthorized' },
      }),
    ).rejects.toThrow()
  })

  it('saves and reloads hero films, background and labels as an editor', async () => {
    const films = [
      { label: 'Games first', source: 'games' as const, enabled: true },
      { label: 'Wedding hidden', source: 'wedding' as const, enabled: false },
    ]
    await payload.updateGlobal({
      slug: 'home',
      overrideAccess: false,
      user: { ...user, collection: 'users' },
      data: {
        hero: { ...home.hero, films, autoPlay: false },
        games: { ...home.games, backgroundStyle: 'plain' },
        galleryKicker: 'Favourite frames',
      },
    })
    const saved = await payload.findGlobal({ slug: 'home', overrideAccess: false, depth: 0 })
    expect(saved.hero.films).toMatchObject(films)
    expect(saved.hero.autoPlay).toBe(false)
    expect(saved.hero.headline).toBe(home.hero.headline)
    expect(saved.games?.backgroundStyle).toBe('plain')
    expect(saved.galleryKicker).toBe('Favourite frames')
    expect(saved.gallery).toEqual(home.gallery)
    expect(saved.about).toEqual(home.about)
  })

  it('edits media descriptions without changing file storage or generated images', async () => {
    const photos = await payload.find({
      collection: 'media',
      where: { mimeType: { contains: 'image' } },
      limit: 1,
      depth: 0,
    })
    expect(photos.docs).toHaveLength(1)
    const photo = photos.docs[0]
    const fileDetails = {
      filename: photo.filename,
      mimeType: photo.mimeType,
      filesize: photo.filesize,
      prefix: photo.prefix,
      _objectKey: photo._objectKey,
      url: photo.url,
      thumbnailURL: photo.thumbnailURL,
      width: photo.width,
      height: photo.height,
      sizes: photo.sizes,
    }
    try {
      const saved = await payload.update({
        collection: 'media',
        id: photo.id,
        overrideAccess: false,
        user: { ...user, collection: 'users' },
        data: { alt: 'Edited wedding photo description' },
      })
      expect(saved.alt).toBe('Edited wedding photo description')
      expect(saved).toMatchObject(fileDetails)
      const reloaded = await payload.findByID({ collection: 'media', id: photo.id, depth: 0 })
      expect(reloaded.alt).toBe(saved.alt)
      expect(reloaded).toMatchObject(fileDetails)
      await expect(
        payload.update({
          collection: 'media',
          id: photo.id,
          overrideAccess: false,
          data: { alt: 'Unauthorized' },
        }),
      ).rejects.toThrow()
    } finally {
      await payload.update({ collection: 'media', id: photo.id, data: { alt: photo.alt } })
    }
  })

  it('saves and reloads navigation, logo choice and animation settings', async () => {
    const changes = {
      navigation: [
        { label: 'Enquire', section: 'contact' as const },
        { label: 'About Akshay', section: 'about' as const },
      ],
      bookingLabel: 'Plan a celebration',
      logoStyle: 'monogram' as const,
      footerNote: 'Made for memorable celebrations.',
      showLogoIntro: false,
      scrollAnimations: false,
      headerLogoTransition: false,
    }
    await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: false,
      user: { ...user, collection: 'users' },
      data: changes,
    })
    const saved = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    expect(saved).toMatchObject(changes)
    expect(saved.phone).toBe(settings.phone)
    expect(saved.whatsapp).toBe(settings.whatsapp)
    expect(saved.logo).toBe(settings.logo)
  })

  it('saves, reorders and hides feedback, while fetching all visible entries beyond twelve', async () => {
    for (let index = 0; index < 16; index++) {
      const comment = await payload.create({
        collection: 'testimonials',
        overrideAccess: false,
        user: { ...user, collection: 'users' },
        data: {
          name: `CMS feedback ${index}`,
          quote: 'Thank you for hosting our celebration!',
          audience: 'celebration',
          sourcePlatform: 'instagram',
          sourceHandle: '@guest',
          sourceUrl: 'https://www.instagram.com/p/DeKEPSoRU0I/',
          featured: index !== 0,
          order: 1000 + index,
        },
      })
      createdTestimonials.push(comment.id)
    }
    const id = createdTestimonials[1]
    await payload.update({
      collection: 'testimonials',
      id,
      overrideAccess: false,
      user: { ...user, collection: 'users' },
      data: { quote: 'Edited original feedback ✨', audience: 'industry', order: 2000 },
    })
    expect(await payload.findByID({ collection: 'testimonials', id })).toMatchObject({
      quote: 'Edited original feedback ✨',
      audience: 'industry',
      order: 2000,
      sourceHandle: '@guest',
      featured: true,
    })
    const { testimonials } = await getSiteData()
    const visibleIds = testimonials.map((comment) => comment.id)
    expect(visibleIds).not.toContain(createdTestimonials[0])
    for (const visible of createdTestimonials.slice(1)) expect(visibleIds).toContain(visible)
    expect(visibleIds.at(-1)).toBe(id)
    await expect(
      payload.update({
        collection: 'testimonials',
        id,
        overrideAccess: false,
        data: { quote: 'Unauthorized' },
      }),
    ).rejects.toThrow()
    await expect(
      payload.update({
        collection: 'testimonials',
        id,
        data: { sourceUrl: 'https://instagram.com.attacker.example/p/example' },
      }),
    ).rejects.toThrow()
  })

  it('rejects a missing upload and a photo selected as a video', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'home',
        data: { hero: { ...home.hero, films: [{ label: 'Missing', source: 'upload' }] } },
      }),
    ).rejects.toMatchObject({
      data: {
        errors: expect.arrayContaining([
          expect.objectContaining({
            message: 'Choose a landscape video for every enabled upload film.',
          }),
        ]),
      },
    })
    const photos = await payload.find({
      collection: 'media',
      where: { mimeType: { contains: 'image' } },
      limit: 1,
    })
    expect(photos.docs).toHaveLength(1)
    await expect(
      payload.updateGlobal({
        slug: 'home',
        data: {
          hero: {
            ...home.hero,
            films: [{ label: 'Wrong media', source: 'upload', video: photos.docs[0].id }],
          },
        },
      }),
    ).rejects.toThrow()
  })

  it('saves a YouTube film without an upload, then edits, reorders and hides it', async () => {
    const film = await payload.create({
      collection: 'reels',
      overrideAccess: false,
      user: { ...user, collection: 'users' },
      data: {
        title: 'YouTube save test',
        category: 'haldi',
        mediaSource: 'youtube',
        orientation: 'portrait',
        youtubeUrl: 'https://youtu.be/zR7TZuHqzy8',
        featured: false,
        order: 900,
      },
    })
    createdReels.push(film.id)
    expect(film.video).toBeFalsy()
    await payload.update({
      collection: 'reels',
      id: film.id,
      overrideAccess: false,
      user: { ...user, collection: 'users' },
      data: {
        title: 'Edited wedding film',
        orientation: 'landscape',
        youtubeUrl: 'https://www.youtube.com/watch?v=TzoFugiu4Go',
        order: 901,
      },
    })
    const saved = await payload.findByID({ collection: 'reels', id: film.id, depth: 0 })
    expect(saved).toMatchObject({
      title: 'Edited wedding film',
      mediaSource: 'youtube',
      orientation: 'landscape',
      youtubeUrl: 'https://www.youtube.com/watch?v=TzoFugiu4Go',
      order: 901,
      featured: false,
    })
    await expect(
      payload.update({
        collection: 'reels',
        id: film.id,
        overrideAccess: false,
        data: { title: 'Unauthorized' },
      }),
    ).rejects.toThrow()
  })

  it('rejects incomplete YouTube links, missing uploads and photos used as videos', async () => {
    for (const youtubeUrl of [
      '',
      'https://www.youtube.com/@akshaytakalkarr',
      'https://example.com/video',
    ]) {
      await expect(
        payload.create({
          collection: 'reels',
          data: {
            title: 'Invalid film',
            category: 'wedding',
            mediaSource: 'youtube',
            orientation: 'portrait',
            youtubeUrl,
          },
        }),
      ).rejects.toThrow()
    }
    await expect(
      payload.create({
        collection: 'reels',
        data: {
          title: 'Missing upload',
          category: 'wedding',
          mediaSource: 'upload',
          orientation: 'portrait',
        },
      }),
    ).rejects.toThrow()
    const photos = await payload.find({
      collection: 'media',
      where: { mimeType: { contains: 'image' } },
      limit: 1,
    })
    await expect(
      payload.create({
        collection: 'reels',
        data: {
          title: 'Wrong media',
          category: 'wedding',
          mediaSource: 'upload',
          orientation: 'portrait',
          video: photos.docs[0].id,
        },
      }),
    ).rejects.toThrow()
  })
})
