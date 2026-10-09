/** Public HTTP checks only. This does not log in, write to the CMS or claim a ranking/performance score. */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { JSDOM } from 'jsdom'

const origin = (process.env.SEO_AUDIT_ORIGIN || 'https://yourdreamanchor.com').replace(/\/$/, '')
const canonical = 'https://yourdreamanchor.com'
const preview = process.env.SEO_AUDIT_PREVIEW === '1'
const checks: { name: string; passed: boolean; detail?: string }[] = []
const pages: { path: string; title: string; canonical: string | null; responsivePhotos: number }[] =
  []
const check = (name: string, passed: boolean, detail?: string) =>
  checks.push({ name, passed, ...(detail ? { detail } : {}) })
const request = (path: string) =>
  fetch(`${origin}${path}`, {
    headers: { 'User-Agent': 'bingbot' },
    signal: AbortSignal.timeout(60000),
  })

const cityResponse = await request('/api/city-pages?limit=2&depth=0')
check('Published city pages can be read publicly', cityResponse.ok)
const cityPages = cityResponse.ok
  ? ((await cityResponse.json()).docs as { city: string; published: boolean }[])
  : []
check(
  'Public city feed excludes drafts',
  cityPages.every((page) => page.published),
)
const paths = ['/', '/privacy', ...cityPages.map((page) => `/wedding-anchor-${page.city}`)]

for (const path of paths) {
  const response = await request(path)
  check(`${path}: successful response`, response.status === 200, String(response.status))
  const dom = new JSDOM(await response.text())
  const document = dom.window.document
  const meta = (name: string) =>
    document
      .querySelector(`meta[name="${name}"], meta[property="${name}"]`)
      ?.getAttribute('content') || ''
  const pageCanonical =
    document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null
  check(
    `${path}: correct canonical`,
    Boolean(pageCanonical && new URL(pageCanonical).href === `${canonical}${path}`),
    pageCanonical || 'Missing',
  )
  check(`${path}: one main heading`, document.querySelectorAll('h1').length === 1)
  check(
    `${path}: useful title and description`,
    Boolean(document.title.trim() && meta('description').trim()),
  )
  check(
    `${path}: correct indexing directive`,
    preview
      ? meta('robots').includes('noindex')
      : /\bindex\b/.test(meta('robots')) && !meta('robots').includes('noindex'),
    meta('robots'),
  )
  check(
    `${path}: complete share preview`,
    meta('og:url') === pageCanonical &&
      Boolean(
        meta('og:title') &&
        meta('og:description') &&
        meta('og:image') &&
        meta('og:image:alt') &&
        meta('twitter:card') === 'summary_large_image',
      ),
  )
  const responsive = [...document.querySelectorAll('main img[srcset]')]
  check(
    `${path}: responsive photos have dimensions and descriptions`,
    responsive.every((image) =>
      Boolean(
        image.getAttribute('alt')?.trim() &&
        Number(image.getAttribute('width')) > 0 &&
        Number(image.getAttribute('height')) > 0 &&
        image.getAttribute('sizes'),
      ),
    ),
  )
  if (path !== '/privacy') {
    check(`${path}: responsive photos are present`, responsive.length > 0)
    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
    let graph: Record<string, unknown>[] = []
    try {
      graph = scripts.flatMap((script) => JSON.parse(script.textContent || '{}')['@graph'] || [])
    } catch {
      /* The check below reports invalid JSON. */
    }
    const types = graph.map((node) => node['@type'])
    check(
      `${path}: valid business and service graph`,
      ['Organization', 'Person', 'WebSite', 'WebPage', 'Service'].every((type) =>
        types.includes(type),
      ),
    )
    const data = JSON.stringify(graph)
    check(
      `${path}: no invented offices or review stars`,
      !['streetAddress', 'aggregateRating', 'reviewRating', 'LocalBusiness'].some((field) =>
        data.includes(field),
      ),
    )
    for (const city of cityPages)
      check(
        `${path}: published ${city.city} page is linked`,
        Boolean(document.querySelector(`a[href="/wedding-anchor-${city.city}"]`)),
      )
    if (path !== '/') {
      check(
        `${path}: breadcrumb and city-prefilled booking form`,
        types.includes('BreadcrumbList') &&
          document.querySelector('input[name="city"]')?.getAttribute('value')?.toLowerCase() ===
            path.replace('/wedding-anchor-', ''),
      )
      check(
        `${path}: opening photo has high priority`,
        document.querySelector('main img')?.getAttribute('fetchPriority') === 'high',
      )
    } else {
      check(
        'Home: opening film cover is preloaded',
        Boolean(document.querySelector('link[rel="preload"][as="image"]')),
      )
    }
  }
  pages.push({
    path,
    title: document.title,
    canonical: pageCanonical,
    responsivePhotos: responsive.length,
  })
  dom.window.close()
}
check('Search titles are unique', new Set(pages.map((page) => page.title)).size === pages.length)

const robotsResponse = await request('/robots.txt')
check('Robots: successful response', robotsResponse.ok)
const robots = await robotsResponse.text()
check(
  'Robots: correct public sitemap address',
  robots.includes(`Sitemap: ${canonical}/sitemap.xml`) && !robots.includes('localhost'),
)
check(
  'Robots: correct crawl policy',
  preview
    ? robots.includes('Disallow: /\n')
    : robots.includes('Allow: /api/media/file/') &&
        robots.includes('Disallow: /admin') &&
        robots.includes('Disallow: /api'),
)

const sitemapResponse = await request('/sitemap.xml')
check('Sitemap: successful response', sitemapResponse.ok)
const sitemapDOM = new JSDOM(await sitemapResponse.text(), { contentType: 'text/xml' })
const urls = [...sitemapDOM.window.document.querySelectorAll('url')]
const locations = urls.map((entry) => entry.querySelector('loc')?.textContent)
check(
  'Sitemap: exactly the public pages',
  locations.length === paths.length &&
    paths.every((path) => locations.includes(`${canonical}${path}`)),
)
check(
  'Sitemap: no private or development URLs',
  locations.every((url) => url?.startsWith(canonical) && !/localhost|\/admin|\/api/.test(url)),
)
check(
  'Sitemap: actual modification dates on editable pages',
  urls
    .filter((entry) => !entry.querySelector('loc')?.textContent?.endsWith('/privacy'))
    .every((entry) =>
      Number.isFinite(Date.parse(entry.querySelector('lastmod')?.textContent || '')),
    ),
)
check(
  'Sitemap: photo discovery is included',
  sitemapDOM.window.document.getElementsByTagName('image:image').length > 0,
)
sitemapDOM.window.close()

const admin = await request('/admin/login')
const adminHTML = new JSDOM(await admin.text())
check(
  'Admin: excluded from indexing in headers and HTML',
  Boolean(
    admin.headers.get('x-robots-tag')?.includes('noindex') &&
    adminHTML.window.document
      .querySelector('meta[name="robots"]')
      ?.getAttribute('content')
      ?.includes('noindex'),
  ),
)
adminHTML.window.close()
const missing = await request('/wedding-anchor-unknown-city')
check('Unknown city: genuine 404', missing.status === 404, String(missing.status))

const report = {
  checkedAt: new Date().toISOString(),
  origin,
  preview,
  pages,
  passed: checks.filter((c) => c.passed).length,
  total: checks.length,
  checks,
}
const output = process.argv[2]
if (output) {
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
}
console.log(JSON.stringify(report, null, 2))
if (checks.some((c) => !c.passed)) process.exitCode = 1
