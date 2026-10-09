type Environment = Record<string, string | undefined>

export const publicSiteOrigin = 'https://yourdreamanchor.com'

function origin(value?: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.origin
      : undefined
  } catch {
    return undefined
  }
}

const local = (value: string) =>
  ['localhost', '127.0.0.1', '[::1]'].includes(new URL(value).hostname)
const deploymentOrigin = (value?: string) => origin(value && `https://${value}`)

/** Production must never inherit a development URL as its public address. */
export function siteOrigin(env: Environment = process.env): string {
  const configured = origin(env.NEXT_PUBLIC_SERVER_URL)
  if ((env.NODE_ENV === 'production' || env.VERCEL === '1') && (!configured || local(configured))) {
    return publicSiteOrigin
  }
  return configured || (env.NODE_ENV === 'production' ? publicSiteOrigin : 'http://localhost:3000')
}

/** Exact trusted origins, including the deployment's own Vercel aliases. No wildcard cookie access. */
export function cmsOrigins(env: Environment = process.env): string[] {
  const urls = [
    siteOrigin(env),
    publicSiteOrigin,
    deploymentOrigin(env.VERCEL_PROJECT_PRODUCTION_URL),
    deploymentOrigin(env.VERCEL_URL),
    ...(env.PAYLOAD_ALLOWED_ORIGINS || '').split(',').map(origin),
    ...(env.NODE_ENV !== 'production'
      ? ['http://localhost:3000', 'http://localhost:3100', 'http://127.0.0.1:3000']
      : []),
  ]
  return [...new Set(urls.filter((url): url is string => Boolean(url)))]
}

/** Keep the preview on the authenticated admin's own trusted origin. */
export function previewURL(requestURL?: string, env: Environment = process.env): string {
  const requested = origin(requestURL)
  return `${requested && cmsOrigins(env).includes(requested) ? requested : siteOrigin(env)}/`
}
