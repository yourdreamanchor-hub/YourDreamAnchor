/** Rebuild the curated web exports from the locally held original Instagram footage. */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const clips = [
  {
    name: 'sangeet',
    source: 'Dcq1M-lR8hz',
    start: 31,
    duration: 12,
    sourceSize: [720, 1280],
    desktopCrop: [720, 405, 0, 380],
    mobileCrop: [720, 880, 0, 240],
  },
  {
    name: 'haldi',
    source: 'DeBzehSRgD4',
    start: 64,
    duration: 12,
    sourceSize: [720, 1280],
    desktopCrop: [720, 405, 0, 410],
    mobileCrop: [720, 880, 0, 240],
  },
  {
    name: 'games',
    source: 'C7ZxSazKZmH',
    start: 8,
    duration: 12,
    sourceSize: [1080, 1920],
    desktopCrop: [1080, 608, 0, 650],
    mobileCrop: [1080, 1260, 0, 380],
  },
]

const output = path.join(root, 'public/media')
fs.mkdirSync(output, { recursive: true })
const run = (args) =>
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: 'pipe' })
const exports = []

for (const clip of clips) {
  const input = path.join(root, `media-import/instagram/${clip.source}.mp4`)
  if (!fs.existsSync(input)) throw new Error(`Original footage is missing: ${input}`)
  for (const device of ['desktop', 'mobile']) {
    const crop = device === 'desktop' ? clip.desktopCrop : clip.mobileCrop
    const dimensions = device === 'desktop' ? [1280, 720] : crop.slice(0, 2)
    const filename = `hero-${clip.name}-${device}-v1`
    const filter = `crop=${crop.join(':')},scale=${dimensions.join(':')}:flags=lanczos,fps=30,setsar=1`
    const video = path.join(output, `${filename}.mp4`)
    run([
      '-ss',
      String(clip.start),
      '-i',
      input,
      '-t',
      String(clip.duration),
      '-vf',
      filter,
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '17',
      '-maxrate',
      '10M',
      '-bufsize',
      '20M',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-y',
      video,
    ])
    run([
      '-ss',
      '0.1',
      '-i',
      video,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      '-y',
      path.join(output, `${filename}-poster.jpg`),
    ])
    exports.push({
      name: clip.name,
      source: `media-import/instagram/${clip.source}.mp4`,
      sourceSize: clip.sourceSize,
      start: clip.start,
      duration: clip.duration,
      device,
      crop,
      dimensions,
      video: `public/media/${filename}.mp4`,
      poster: `public/media/${filename}-poster.jpg`,
      bytes: fs.statSync(video).size,
    })
    console.log(
      `${filename}: ${dimensions.join(' × ')}, ${(fs.statSync(video).size / 1e6).toFixed(1)} MB`,
    )
  }
}

fs.mkdirSync(path.join(root, 'design'), { recursive: true })
fs.writeFileSync(
  path.join(root, 'design/hero-films.json'),
  JSON.stringify(
    {
      encoding: 'H.264, CRF 17, 30 fps, no audio, fast start',
      note: 'Exports retain the original footage quality. Scaling and reframing do not create missing detail; these are not native 1080p or AI upscales.',
      exports,
    },
    null,
    2,
  ) + '\n',
)
