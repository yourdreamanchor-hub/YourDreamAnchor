import data from './brand-morph-data.json'

export const wordmarkGlyphs = data.glyphs

const smooth = (value: number) => {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

function contour(points: number[][]) {
  return `M${points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}Z`
}

/** Transform the actual glyph contours into pieces of the exact mark, without a crossfade. */
export function morphWordmark(paths: SVGPathElement[], progress: number) {
  wordmarkGlyphs.forEach((glyph, index) => {
    const path = paths[index]
    if (!path) return
    const delay = (index / (wordmarkGlyphs.length - 1)) * 0.08
    const position = Math.min(1, Math.max(0, (progress - delay) / (1 - delay)))
    if (position === 0 || position === 1) {
      path.setAttribute('d', position === 0 ? glyph.sourceD : glyph.targetD)
      return
    }
    // Gather and orient whole letters first, then straighten their contours into logo strokes.
    const movement = smooth(position / 0.72)
    const shape = smooth((position - 0.38) / 0.62)
    const angle = glyph.layout.angle * movement
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    const scales = glyph.layout.scale.map((value) => 1 + (value - 1) * movement)
    const center = glyph.layout.origin.map(
      (value, axis) => value + (glyph.center[axis] - value) * movement,
    )
    const gather = (point: number[]) => {
      const x = (point[0] - glyph.layout.origin[0]) * scales[0]
      const y = (point[1] - glyph.layout.origin[1]) * scales[1]
      return [x * cosine - y * sine + center[0], x * sine + y * cosine + center[1]]
    }
    const outer = glyph.from.map((point, i) =>
      gather(point).map((value, axis) => value + (glyph.to[i][axis] - value) * shape),
    )
    const holes = glyph.holes.map((hole) =>
      hole.map((point) =>
        gather(point).map((value, axis) => value + (glyph.center[axis] - value) * shape),
      ),
    )
    path.setAttribute('d', contour(outer) + holes.map(contour).join(''))
  })
}
