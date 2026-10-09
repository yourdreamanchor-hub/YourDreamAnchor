import type { Home, SiteSetting } from '@/payload-types'

export const sectionOptions = [
  { label: 'About', value: 'about' },
  { label: 'Ceremonies', value: 'services' },
  { label: 'Moments', value: 'moments' },
  { label: 'Gallery', value: 'gallery' },
  { label: 'Games', value: 'games' },
  { label: 'Destinations', value: 'destinations' },
  { label: 'Kind words', value: 'love' },
  { label: 'Bookings', value: 'contact' },
]

export const defaultNavigation = sectionOptions.filter(({ value }) =>
  ['about', 'services', 'moments', 'gallery', 'games', 'love'].includes(value),
)

export function navigationLinks(settings: SiteSetting, available: Set<string>) {
  const links =
    settings.navigation ?? defaultNavigation.map(({ label, value }) => ({ label, section: value }))
  return links
    .filter((link) => link.label?.trim() && available.has(link.section))
    .map((link) => ({ label: link.label, href: `#${link.section}` }))
}

const artwork = '/media/games-celebration-v1.webp'
export function gamesBackdrop(games: Home['games'], uploaded?: string) {
  return games?.backgroundStyle === 'plain'
    ? undefined
    : games?.backgroundStyle === 'upload'
      ? uploaded
      : artwork
}

/** A media replacement is always respected when the editor explicitly chooses an uploaded logo. */
export function selectedLogo(settings: SiteSetting, uploaded?: string) {
  return settings.logoStyle === 'upload'
    ? uploaded || '/brand/anchor-monogram-v1.svg'
    : '/brand/anchor-monogram-v1.svg'
}
