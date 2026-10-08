/** Derive every exported logo asset from the same traced geometry used by BrandMark. */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

import { brandStrokes } from '../src/lib/brand'

const directory = path.resolve('public/brand')
const paths = brandStrokes.map(({ outline }) => `<path d="${outline}"/>`).join('')
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 175 141" width="700" height="564"><g fill="#fff">${paths}</g></svg>\n`
const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180"><rect width="180" height="180" rx="28" fill="#0d0812"/><g fill="#fff" transform="translate(27 41) scale(.84)">${paths}</g></svg>\n`

await mkdir(directory, { recursive: true })
await writeFile(path.join(directory, 'anchor-monogram-v1.svg'), mark)
await writeFile(path.join(directory, 'anchor-icon-v1.svg'), tile)
await sharp(Buffer.from(tile)).png().toFile(path.join(directory, 'anchor-apple-icon-v1.png'))
