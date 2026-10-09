import type { Home } from '@/payload-types'
import { mediaUrl } from './media'

const approvedHero = {
  src: '/media/hero-quality-v1.mp4',
  poster: '/media/hero-quality-v1-poster.jpg',
}

export type HeroFilm = {
  id: string
  label: string
  src?: string
  poster?: string
  mobileSrc?: string
  mobilePoster?: string
}

const additionalFilms: HeroFilm[] = ['sangeet', 'haldi', 'games'].map((id) => ({
  id,
  label: id.charAt(0).toUpperCase() + id.slice(1),
  src: `/media/hero-${id}-desktop-v1.mp4`,
  poster: `/media/hero-${id}-desktop-v1-poster.jpg`,
  mobileSrc: `/media/hero-${id}-mobile-v1.mp4`,
  mobilePoster: `/media/hero-${id}-mobile-v1-poster.jpg`,
}))

/** Use the approved export for the original film; new CMS uploads keep their own video and poster. */
export function heroMedia(src?: string, poster?: string): { src?: string; poster?: string } {
  const filename = src?.split(/[?#]/)[0].split('/').pop()
  if (filename === 'hero-loop.mp4' || filename === 'hero-loop-1.mp4') return approvedHero
  return { src, poster }
}

/** Curated films accompany the approved opener. A different CMS selection remains its own film. */
export function heroFilms(
  src?: string,
  poster?: string,
  configured?: Home['hero']['films'],
): HeroFilm[] {
  if (configured !== undefined && configured !== null) {
    const presets = [{ ...approvedHero, id: 'wedding', label: 'Wedding' }, ...additionalFilms]
    const films = configured
      .filter((row) => row.enabled !== false)
      .flatMap((row, index) => {
        const preset = presets.find((film) => film.id === row.source)
        const film = {
          src: preset?.src || mediaUrl(row.video),
          poster: mediaUrl(row.poster, 'wide') || preset?.poster,
          mobileSrc: mediaUrl(row.mobileVideo) || preset?.mobileSrc,
          mobilePoster: mediaUrl(row.mobilePoster, 'wide') || preset?.mobilePoster,
        }
        return film.src ? [{ ...film, id: row.id || `film-${index}`, label: row.label }] : []
      })
    return films.length ? films : [{ id: 'still', label: 'Highlights', poster }]
  }
  const opening = heroMedia(src, poster)
  if (opening.src === approvedHero.src) {
    return [{ ...opening, id: 'wedding', label: 'Wedding' }, ...additionalFilms]
  }
  return [{ ...opening, id: 'custom', label: 'Highlights' }]
}
