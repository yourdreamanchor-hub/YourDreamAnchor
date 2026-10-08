/** Faithful vector tracing of the white monogram in the supplied IMG_4572.jpg. */
export const brandStrokes = [
  {
    outline: 'M0 74 76 0 151 74H134L76 17 16 74Z',
    draw: 'M8 73 76 8 143 73',
    delay: 0,
    duration: 640,
  },
  { outline: 'M70 15H82V104L70 116Z', draw: 'M76 15V118', delay: 220, duration: 520 },
  { outline: 'M40 62H139L151 74H50Z', draw: 'M40 68H153', delay: 380, duration: 420 },
  { outline: 'M82 72 134 117H115L82 87Z', draw: 'M79 77 133 123', delay: 520, duration: 420 },
] as const

export const monogramUrl = '/brand/anchor-monogram-v1.svg'
export const brandIconUrl = '/brand/anchor-icon-v1.svg'
export const brandAppleIconUrl = '/brand/anchor-apple-icon-v1.png'

/** The bundled mark replaces the old avatar; a future CMS logo still takes precedence. */
export function brandLogo(src?: string): string {
  const filename = src?.split('?')[0].split('/').pop()
  return !src ||
    /^(logo-avatar(?:-\d+)?\.jpg|anchor-monogram-v1(?:-\d+)?\.svg)$/.test(filename || '')
    ? monogramUrl
    : src
}

export function brandWordmark(brand: string): string {
  return brand === 'Your Dream Anchor' ? 'YourDreamAnchor' : brand
}
