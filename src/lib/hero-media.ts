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
export function heroFilms(src?: string, poster?: string): HeroFilm[] {
  const opening = heroMedia(src, poster)
  if (opening.src === approvedHero.src) {
    return [{ ...opening, id: 'wedding', label: 'Wedding' }, ...additionalFilms]
  }
  return [{ ...opening, id: 'custom', label: 'Highlights' }]
}
