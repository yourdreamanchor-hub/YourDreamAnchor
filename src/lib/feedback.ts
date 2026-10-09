export const feedbackAudiences = [
  { value: 'celebration', label: 'Celebrations' },
  { value: 'industry', label: 'Collaborators' },
  { value: 'community', label: 'Community' },
] as const

export type FeedbackAudience = (typeof feedbackAudiences)[number]['value']
export type FeedbackPlatform = 'instagram' | 'youtube' | 'other'

/** Keep editor-provided source links on the named platform, without embedded credentials. */
export function feedbackSource(
  value?: string | null,
  platform?: string | null,
): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return undefined
    if (platform === 'instagram' && !['instagram.com', 'www.instagram.com'].includes(url.hostname))
      return undefined
    if (
      platform === 'youtube' &&
      !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)
    )
      return undefined
    return url.href
  } catch {
    return undefined
  }
}
