const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/
const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com'])

/** Accept video links, never arbitrary iframe HTML or links to another host. */
export function youtubeVideoId(value?: string | null): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return undefined
    const path = url.pathname.split('/').filter(Boolean)
    let id: string | null | undefined
    if (url.hostname === 'youtu.be' && path.length === 1) id = path[0]
    else if (youtubeHosts.has(url.hostname)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v')
      else if (['shorts', 'embed', 'live'].includes(path[0]) && path.length === 2) id = path[1]
    } else if (
      url.hostname === 'www.youtube-nocookie.com' &&
      path[0] === 'embed' &&
      path.length === 2
    ) {
      id = path[1]
    }
    return id && videoIdPattern.test(id) ? id : undefined
  } catch {
    return undefined
  }
}

export function youtubeVideo(value?: string | null) {
  const id = youtubeVideoId(value)
  if (!id) return undefined
  return {
    id,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`,
    poster: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    fallbackPoster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  }
}
