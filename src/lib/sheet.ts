// The geometry of a chart sheet: where the fix sits and where each mark on
// the frame prints, in the plate's viewBox units. Pure, so sheet.test.ts can
// prove the collision rules without a browser. Change a range, the icon or
// the name size here and rerun `npm test`.
export const TICK = 6;
/** A logo prints this many units square, centred 14 in from its edge. */
export const ICON = 16;

export type Edge = 'top' | 'right' | 'bottom' | 'left';
export type Box = { x0: number; x1: number; y0: number; y1: number };

export type Plate = {
  w: number;
  h: number;
  /** Whether names and bearing degrees print on this plate. */
  names: boolean;
  /** Where marks may sit: x on the top edge, y on the sides, one x below. */
  top: [number, number];
  side: [number, number];
  bottom: number;
  fixX: [number, number];
  fixY: [number, number];
  /** What the title block covers, for the check. */
  block: Box;
};

// The landscape plate, sm and up. Three top slots are 160 units apart,
// which clears a logo and a sixteen-character name (125 units from the
// slot) printing to the right of it, and the last slot keeps that inside
// the frame. Two side slots are 75 apart, which clears a logo with its name
// above or below it, and stop short of the title block. The bottom slot
// sits right of the block with its name running to the frame. The fix band
// lies between the side slots (87.5 and 162.5), so a pair of marks facing
// each other across it never draws one flat line through the fix.
export const WIDE: Plate = {
  w: 640, h: 300, names: true,
  top: [80, 560], side: [50, 200], bottom: 470,
  fixX: [300, 380], fixY: [98, 140],
  block: { x0: 0, x1: 384, y0: 250, y1: 300 },
};

// The portrait plate for phones, logos only: at a third of the drawn size
// a landscape sheet is a strip and the marks are specks. The names print
// under the description there instead.
export const TALL: Plate = {
  w: 320, h: 360, names: false,
  top: [40, 280], side: [40, 230], bottom: 240,
  fixX: [140, 200], fixY: [130, 180],
  block: { x0: 0, x1: 192, y0: 320, y1: 360 },
};

// Slots per edge by stack size: top, right, bottom, left. Bearings have to
// arrive from opposing quadrants, or the fix is a spray from one arc. The
// bottom holds one mark because the title block owns the bottom-left and a
// name printing leftwards from a second one would run into it.
const SPLIT: Record<number, [number, number, number, number]> = {
  3: [1, 1, 0, 1],
  4: [2, 1, 0, 1],
  5: [2, 1, 1, 1],
  6: [2, 2, 1, 1],
  7: [3, 2, 1, 1],
  8: [3, 2, 1, 2],
};

export type Mark = {
  name: string;
  edge: Edge;
  /** Where the mark meets the frame: x on the top and bottom, y on the sides. */
  at: number;
  /** Centre of the logo, when the name has one. A plain tick otherwise. */
  icon?: { x: number; y: number };
  /** Where the bearing starts: under the logo, or at the tick's inner end. */
  from: { x: number; y: number };
  /** Where the name is anchored, and which way it runs from there. */
  text: { x: number; y: number; anchor: 'start' | 'end' };
  /** The true bearing from the fix to the mark, and where it prints. */
  bearing: number;
  degree: { x: number; y: number; rotate: number };
};

export type Layout = {
  fix: { x: number; y: number };
  marks: Mark[];
  /** Graticule lines, square cells, so no two sheets share a grid. */
  grid: { x: number[]; y: number[] };
};

// FNV-1a, 32 bit. Anything deterministic would do; this one is five lines.
const hash = (s: string, seed: number) => {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};
const pick = ([lo, hi]: [number, number], h: number) => lo + (h % (hi - lo + 1));

// Evenly spread and centred in the range: one slot lands in the middle,
// three land at a sixth, a half and five sixths.
const spread = ([lo, hi]: [number, number], n: number, i: number) => lo + ((hi - lo) * (i + 0.5)) / n;

const lines = (offset: number, step: number, limit: number) => {
  const out: number[] = [];
  for (let v = offset; v < limit; v += step) out.push(v);
  return out;
};

export function layout(title: string, stack: string[], hasLogo: (name: string) => boolean, plate: Plate = WIDE): Layout {
  const fix = { x: pick(plate.fixX, hash(title, 2166136261)), y: pick(plate.fixY, hash(title, 5381)) };
  const grid = {
    x: lines(10 + (hash(title, 7) % 90), 100, plate.w),
    y: lines(10 + (hash(title, 11) % 90), 100, plate.h),
  };

  const split = SPLIT[stack.length];
  if (!split) throw new Error(`a sheet takes 3 to 8 names, not ${stack.length}`);
  const edges: Edge[] = ['top', 'right', 'bottom', 'left'];
  const marks: Mark[] = [];
  let i = 0;
  edges.forEach((edge, e) => {
    const n = split[e];
    for (let k = 0; k < n; k++, i++) marks.push(mark(plate, stack[i], edge, k, n, fix, hasLogo(stack[i])));
  });
  return { fix, marks, grid };
}

// One anchoring rule per frame. A name on the top or bottom edge prints to
// the right of its logo, whose body the bearing starts under; a name on a
// side edge prints above or below its logo, on the side away from the fix,
// so its own bearing never crosses it. A mark without a logo is a tick, and
// its name keeps clear of the bearing by sitting away from the fix.
function mark(plate: Plate, name: string, edge: Edge, k: number, n: number, fix: { x: number; y: number }, logo: boolean): Mark {
  const { w: W, h: H } = plate;
  const place = (m: Omit<Mark, 'bearing' | 'degree'>): Mark => ({ ...m, ...degrees(m.from, fix) });
  if (edge === 'top' || edge === 'bottom') {
    const x = edge === 'top' ? spread(plate.top, n, k) : plate.bottom;
    const top = edge === 'top';
    if (logo) {
      return place({
        name, edge, at: x,
        icon: { x, y: top ? 14 : H - 14 },
        from: { x, y: top ? 24 : H - 24 },
        text: { x: x + 12, y: top ? 18 : H - 10, anchor: 'start' },
      });
    }
    const left = x < fix.x;
    return place({
      name, edge, at: x,
      from: { x, y: top ? TICK : H - TICK },
      text: { x: left ? x - 4 : x + 4, y: top ? 16 : H - 8, anchor: left ? 'end' : 'start' },
    });
  }
  const y = spread(plate.side, n, k);
  const right = edge === 'right';
  const above = y < fix.y;
  if (logo) {
    return place({
      name, edge, at: y,
      icon: { x: right ? W - 14 : 14, y },
      from: { x: right ? W - 24 : 24, y },
      text: { x: right ? W - 6 : 6, y: above ? y - 12 : y + 21, anchor: right ? 'end' : 'start' },
    });
  }
  return place({
    name, edge, at: y,
    from: { x: right ? W - TICK : TICK, y },
    text: { x: right ? W - 10 : 10, y: above ? y - 5 : y + 13, anchor: right ? 'end' : 'start' },
  });
}

// The bearing is what a navigator writes along the line: degrees true from
// the fix to the mark, north up. It prints a third of the way in from the
// mark, set along the stroke and kept upright.
function degrees(from: { x: number; y: number }, fix: { x: number; y: number }) {
  const dx = fix.x - from.x;
  const dy = fix.y - from.y;
  const bearing = Math.round((Math.atan2(-dx, dy) * 180) / Math.PI + 360) % 360;
  let rotate = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (rotate > 90) rotate -= 180;
  if (rotate < -90) rotate += 180;
  const t = 0.38;
  return { bearing, degree: { x: from.x + dx * t, y: from.y + dy * t, rotate } };
}
