import type { Reel } from '@/payload-types'
import type { ReelCard } from '@/components/site/Moments'
import { reelCategories } from '@/collections/Reels'
import { mediaUrl } from './media'
import { youtubeVideo } from './youtube'

const categoryLabel = Object.fromEntries(reelCategories.map((c) => [c.value, c.label]))

export function reelCards(reels: Reel[]): ReelCard[] {
  return reels.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    categoryLabel: categoryLabel[r.category] ?? r.category,
    location: r.location,
    caption: r.caption,
    video: mediaUrl(r.video),
    poster: mediaUrl(r.poster, r.mediaSource === 'youtube' ? 'wide' : 'card'),
    instagramUrl: r.instagramUrl,
    mediaSource: r.mediaSource ?? 'upload',
    youtubeUrl: r.mediaSource === 'youtube' ? youtubeVideo(r.youtubeUrl)?.watchUrl : undefined,
    orientation: r.orientation ?? 'portrait',
  }))
}
