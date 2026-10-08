const approvedHero = {
  src: '/media/hero-quality-v1.mp4',
  poster: '/media/hero-quality-v1-poster.jpg',
}

/** Use the approved export for the original film; new CMS uploads keep their own video and poster. */
export function heroMedia(src?: string, poster?: string): { src?: string; poster?: string } {
  const filename = src?.split(/[?#]/)[0].split('/').pop()
  if (filename === 'hero-loop.mp4' || filename === 'hero-loop-1.mp4') return approvedHero
  return { src, poster }
}
