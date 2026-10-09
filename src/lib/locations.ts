export const cities = [
  { value: 'mumbai', label: 'Mumbai', slug: 'wedding-anchor-mumbai' },
  { value: 'bengaluru', label: 'Bengaluru', slug: 'wedding-anchor-bengaluru' },
] as const

export type City = (typeof cities)[number]['value']

export function cityInfo(city: City) {
  return cities.find((entry) => entry.value === city)!
}

export function cityFromSlug(slug: string): City | undefined {
  return cities.find((entry) => entry.slug === slug)?.value
}

export function cityPath(city: City) {
  return `/${cityInfo(city).slug}`
}

/** Match the event's location, rather than a city mentioned in its story or title. */
export function isInCity(location: string | null | undefined, city: City): boolean {
  return city === 'mumbai'
    ? /\bmumbai\b/i.test(location || '')
    : /\b(?:bengaluru|bangalore)\b/i.test(location || '')
}
