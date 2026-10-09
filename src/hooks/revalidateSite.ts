import { revalidatePath } from 'next/cache'

/** Refreshes the cached home page as soon as the admin saves content. */
export const revalidateSite = () => {
  try {
    revalidatePath('/', 'layout')
    revalidatePath('/sitemap.xml')
  } catch {
    // Outside a Next.js request (e.g. the seed script) there is no cache to clear.
  }
}
