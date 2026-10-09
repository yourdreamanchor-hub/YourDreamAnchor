// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { getPayload, JWTAuthentication, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import config from '@/payload.config'
import type { Home, SiteSetting, User } from '@/payload-types'
import { cmsOrigins } from '@/lib/site-origin'

let payload: Payload
let home: Home
let settings: SiteSetting
let user: User
let token: string

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
})
