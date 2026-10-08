"""Turn the site's existing Fraunces wordmark into morphable vector contours.

Build-time only: install fonttools and brotli, then pass the regular Latin WOFF2
from Next's downloaded fonts. The generated JSON needs no font parser at runtime.
"""
import json
import math
from pathlib import Path
import sys

from fontTools.pens.basePen import BasePen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont


class Contours(BasePen):
    def __init__(self, glyphs):
        super().__init__(glyphs)
        self.contours = []

    def _moveTo(self, point):
        self.contours.append([point])

    def _lineTo(self, point):
        self.contours[-1].append(point)

    def _curveToOne(self, a, b, c):
        origin = self.contours[-1][-1]
        for step in range(1, 25):
            t = step / 24
            u = 1 - t
            self._lineTo(tuple(u**3 * origin[i] + 3*u*u*t*a[i] + 3*u*t*t*b[i] + t**3*c[i] for i in (0, 1)))

    def _qCurveToOne(self, control, end):
        origin = self.contours[-1][-1]
        for step in range(1, 25):
            t = step / 24
            u = 1 - t
            self._lineTo(tuple(u*u*origin[i] + 2*u*t*control[i] + t*t*end[i] for i in (0, 1)))

    def _closePath(self):
        pass

    def _endPath(self):
        pass


def area(points):
    return sum(a[0]*b[1] - b[0]*a[1] for a, b in zip(points, points[1:] + points[:1])) / 2


def sample(points, count):
    edges = [(a, b, math.dist(a, b)) for a, b in zip(points, points[1:] + points[:1])]
    perimeter = sum(edge[2] for edge in edges)
    result = []
    cursor = 0
    offset = 0
    for index in range(count):
        distance = index * perimeter / count
        while cursor < len(edges) - 1 and distance > offset + edges[cursor][2]:
            offset += edges[cursor][2]
            cursor += 1
        a, b, length = edges[cursor]
        t = (distance - offset) / length if length else 0
        result.append([round(a[i] + (b[i] - a[i])*t, 4) for i in (0, 1)])
    return result


def clip(points, vector, bound, keep_above):
    def value(point):
        return point[0]*vector[0] + point[1]*vector[1] - bound
    result = []
    for a, b in zip(points, points[1:] + points[:1]):
        va, vb = value(a), value(b)
        inside_a = va >= -1e-9 if keep_above else va <= 1e-9
        inside_b = vb >= -1e-9 if keep_above else vb <= 1e-9
        if inside_a:
            result.append(a)
        if inside_a != inside_b:
            t = va / (va - vb)
            result.append([a[i] + (b[i] - a[i])*t for i in (0, 1)])
    return result


def thirds(polygon, vector):
    values = [p[0]*vector[0] + p[1]*vector[1] for p in polygon]
    low, high = min(values), max(values)
    pieces = []
    for index in range(3):
        start = low + (high - low)*index/3
        end = low + (high - low)*(index + 1)/3
        pieces.append(clip(clip(polygon, vector, start, True), vector, end, False))
    return pieces


def normalize(points):
    center = [sum(p[i] for p in points)/len(points) for i in (0, 1)]
    radius = max(math.dist(p, center) for p in points)
    return [[(p[i] - center[i])/radius for i in (0, 1)] for p in points]


def align(source, target):
    if area(source)*area(target) < 0:
        target = list(reversed(target))
    a, b = normalize(source), normalize(target)
    shift = min(range(len(target)), key=lambda shift: sum(math.dist(p, b[(index + shift) % len(b)])**2 for index, p in enumerate(a)))
    return target[shift:] + target[:shift]


font_path = Path(sys.argv[1])
font = TTFont(font_path)
if font['name'].getDebugName(1) != 'Fraunces' or font['name'].getDebugName(2) != 'Regular':
    raise ValueError('Use the regular Fraunces font already downloaded by Next.')
glyphs = font.getGlyphSet(location={'wght': 400, 'opsz': 23, 'SOFT': 0})
cmap = font.getBestCmap()
scale = 23 / font['head'].unitsPerEm
logo_scale = 44 / 153
logo_y = (48 - 119*logo_scale)/2 + logo_scale

# Split the exact monogram geometry into fifteen pieces, one for each letter.
pieces = (
    thirds([[0, 74], [76, 0], [76, 17], [16, 74]], [1, -1]) +
    thirds([[76, 0], [151, 74], [134, 74], [76, 17]], [1, 1]) +
    thirds([[70, 15], [82, 15], [82, 104], [70, 116]], [0, 1]) +
    thirds([[40, 62], [139, 62], [151, 74], [50, 74]], [1, 0]) +
    thirds([[82, 72], [134, 117], [115, 117], [82, 87]], [1, 1])
)
wordmark = 'YourDreamAnchor'
result = []
advance = 0
for index, (character, piece) in enumerate(zip(wordmark, pieces)):
    glyph = glyphs[cmap[ord(character)]]
    pen = Contours(glyphs)
    glyph.draw(pen)
    contours = [[[(x*scale + advance), (32 - y*scale)] for x, y in contour] for contour in pen.contours]
    contours.sort(key=lambda contour: abs(area(contour)), reverse=True)
    outer = sample(contours[0], 64)
    holes = [sample(contour, 24) for contour in contours[1:]]
    target = [[x*logo_scale + logo_scale, y*logo_scale + logo_y] for x, y in piece]
    direction = [[-1, 1], [1, 1], [0, 1], [1, 0], [1, 1]][index//3]
    magnitude = math.hypot(*direction)
    major = [value/magnitude for value in direction]
    minor = [major[1], -major[0]]
    projections = [[p[0]*axis[0] + p[1]*axis[1] for p in target] for axis in [minor, major]]
    mid = [(min(values) + max(values))/2 for values in projections]
    center = [minor[i]*mid[0] + major[i]*mid[1] for i in (0, 1)]
    bounds = [[min(p[i] for p in outer), max(p[i] for p in outer)] for i in (0, 1)]
    source_center = [sum(values)/2 for values in bounds]
    sizes = [(max(values) - min(values))/(bounds[i][1] - bounds[i][0]) for i, values in enumerate(projections)]
    angle = math.atan2(major[1], major[0]) - math.pi/2
    def gathered(point):
        x, y = [(point[i] - source_center[i])*sizes[i] for i in (0, 1)]
        return [x*math.cos(angle) - y*math.sin(angle) + center[0], x*math.sin(angle) + y*math.cos(angle) + center[1]]
    path_pen = SVGPathPen(glyphs)
    glyph.draw(TransformPen(path_pen, (scale, 0, 0, -scale, advance, 32)))
    result.append({
        'letter': character,
        'sourceD': path_pen.getCommands(),
        'targetD': 'M' + ' '.join(f'{x:.4f},{y:.4f}' for x, y in target) + 'Z',
        'from': outer,
        'holes': holes,
        'to': align([gathered(point) for point in outer], sample(target, 64)),
        'center': center,
        'layout': {'origin': source_center, 'angle': angle, 'scale': sizes},
    })
    advance += glyph.width*scale - .46

output = Path('src/lib/brand-morph-data.json')
output.write_text(json.dumps({
    'wordmark': wordmark,
    'font': 'Fraunces Regular, weight 400, optical size 23, SOFT 0',
    'copyright': font['name'].getDebugName(0),
    'license': font['name'].getDebugName(14),
    'glyphs': result,
}, separators=(',', ':')) + '\n')
print(f'Wrote {len(result)} glyphs; wordmark width {advance:.1f}px; {output.stat().st_size} bytes.')
