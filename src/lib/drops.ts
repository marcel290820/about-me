// The ink: one blot per stack name, its area the weight of use across
// every sheet. Nothing is lettered on the paper: the domains a stack was
// used in are reversed out of its blot when it opens on hover. Position is
// a quieter reading: a blot is pulled from the plate's middle toward the
// side its domains own, so the data stacks lie together and a stack used
// everywhere lies in the middle, and opening a few neighbours confirms it.
//
// Units are the plate's own: W wide, H tall, one unit a pixel at the
// column's full width. The phone has a plate of its own, tall where the
// column is narrow, so the blots keep their size and the packing is the
// same spill; wrapped in rows they read as rows. It is smaller than the
// wide plate, because the spiral fills a narrow plate more tightly. The
// packing is a spiral out from where the blot wants to be, elliptical for
// a landscape plate, with its start angle hashed from the name. A blot is
// placed where it first fits clear of every blot already down, or the
// layout throws: a plate with no room is a build error, not a plate with
// a blot missing.

export type Box = { x0: number; x1: number; y0: number; y1: number };
// A plate: its size, and the paper on it the blots keep clear of, where
// the inkwell and the quill lie.
export type Plate = { w: number; h: number; keep: Box[] };
export const W = 720;
export const H = 460;
export const WIDE: Plate = {
  w: W,
  h: H,
  keep: [
    { x0: 212, x1: 294, y0: 158, y1: 262 },
    { x0: 132, x1: 328, y0: 268, y1: 392 },
  ],
};
export const TALL: Plate = {
  w: 360,
  h: 760,
  keep: [
    { x0: 58, x1: 150, y0: 255, y1: 345 },
    { x0: 30, x1: 160, y0: 442, y1: 640 },
  ],
};
// The marks that tell the story of the spill: the inkwell that went over
// in the swell, and the quill beside it. Each is drawn in its own box, in
// plate units, and placed by an origin on the plate with a turn about it:
// the well's origin is its mouth, which is where the ink runs out toward
// the heaviest blot, and the quill's is its middle.
export type Mark = { w: number; h: number; origin: [number, number]; wide: { x: number; y: number; rot: number }; tall: { x: number; y: number; rot: number } };
export const WELL: Mark = { w: 100, h: 80, origin: [57, 40], wide: { x: 284, y: 204, rot: 18 }, tall: { x: 128, y: 322, rot: 42 } };
export const QUILL: Mark = { w: 200, h: 60, origin: [100, 30], wide: { x: 230, y: 330, rot: -22 }, tall: { x: 95, y: 540, rot: -62 } };
const EDGE = 8;
// Paper kept between blots at rest, the least of it and how much more a
// blot may keep, hashed from its name, so some lie close and some clear:
// packed evenly they are a chart, unevenly a spill. An open blot shoves
// its neighbours aside in the browser, so the packing keeps no room for
// it.
const GAP = 6;
const SLACK = 24;
// How far a blot's middle is pulled from the plate's middle toward the
// domains it was used in: from the least to the least plus the span,
// hashed from the name, so a few land well past the rest and the ink's
// outline is not a lens with an even margin.
const PULL = 0.55;
const PULL_SPAN = 0.5;
// Size by weight: r = R_K * w^R_EXP, between the limits. Area in
// proportion to weight is what the eye reads as less than proportion, so
// the exponent sits above a half, and a three-sheet stack is plainly
// bigger than a one-sheet one. The floor is the smallest blot a logo
// reads out of with ink round it; the plate prints nothing lighter than a
// sheet, so the floor lifts only the lightest.
export const R_MIN = 15;
export const R_MAX = 52;
const R_K = 12.5;
const R_EXP = 0.6;

export type Weighed = { name: string; weight: number; domains: string[] };
export type Blot = Weighed & { x: number; y: number; r: number };
export type Anchor = { domain: string; x: number; y: number };

export const radius = (weight: number) => Math.min(R_MAX, Math.max(R_MIN, R_K * Math.pow(weight, R_EXP)));

// The ring the domains letter on, as a fraction of the open radius, and
// what has to fit between it and the logo: half a word's height when the
// words sit above and below the logo, and half the longest domain word
// (with the rim's warp) when there are more than two and some sit beside
// it. A single word sits under the logo on a tighter ring, so the pool
// is what one word needs and not a ring with one word on it. The logo is
// 1.1 r across.
const RING = 0.6;
const RING_ONE = 0.45;
const WORD_H = 5;
const WORD_SIDE = 30;
// The chord the longest word needs at its ring, with the rim's warp and
// the word's own jitter: on the wide ring and on the tight one.
const CHORD = 40;
const CHORD_ONE = 36;
export const ring = (domains: number) => (domains === 1 ? RING_ONE : RING);
// The words are lettered at ten units in a small pool and grow with it, to
// thirteen, so a wide pool is not ringed in fine print.
export const wordSize = (R: number) => Math.min(13, Math.max(10, 10 + 0.08 * (R - 40)));
// The radius a blot opens to on hover: what its ring of domains needs at
// the size they letter, never less than the chord the longest word needs,
// and never less than two fifths again, so the lightest blot open stays
// smaller than the heaviest at rest and the area keeps its meaning. The
// words grow with the pool and the pool with the words; a few rounds
// settle it.
export const opened = (r: number, domains: number) => {
  let R = 40;
  for (let i = 0; i < 4; i++) {
    const k = wordSize(R) / 10;
    R = Math.max(r * 1.4, (0.55 * r + 3 + (domains > 2 ? WORD_SIDE : WORD_H) * k) / ring(domains), (domains === 1 ? CHORD_ONE : CHORD) * k);
  }
  return R;
};

// A point's distance to the nearest point of a box.
export const toBox = (x: number, y: number, b: Box) => Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.y0 - y, 0, y - b.y1));

// FNV-1a, 32 bit, the same as the sheet's.
export const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};

// Where each domain pulls toward: round the plate from the top, the first
// domain at twelve o'clock, on an ellipse well inside the frame so a
// cluster of one domain's stacks has room to spread round its anchor.
const ORBIT = 0.4;
export function anchors(domains: string[], plate: Plate = WIDE): Anchor[] {
  return domains.map((domain, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / domains.length;
    return { domain, x: plate.w / 2 + ORBIT * plate.w * Math.cos(a), y: plate.h / 2 + ORBIT * plate.h * Math.sin(a) };
  });
}

export function layout(items: Weighed[], domains: string[], plate: Plate = WIDE): Blot[] {
  const { w, h } = plate;
  const pulls = anchors(domains, plate);
  // The spiral leans with the plate, so the cluster fills it rather than
  // reading as a lens in a landscape or a column in a portrait.
  const aspect = Math.sqrt(w / h);
  const blots: Blot[] = [];
  // Heaviest first, so the pools take the middle and the rest fit round
  // them; ties by name so the order is stable.
  const order = [...items].sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
  for (const item of order) {
    const r = radius(item.weight);
    const phi = (hash(item.name) % 360) * (Math.PI / 180);
    const gap = GAP + ((hash(item.name) >>> 9) % (SLACK + 1));
    const its = pulls.filter((a) => item.domains.includes(a.domain));
    if (!its.length) throw new Error(`${item.name} was used in no domain on the plate`);
    const pull = PULL + (PULL_SPAN * ((hash(item.name) >>> 16) % 101)) / 100;
    const cx = w / 2 + pull * (its.reduce((s, a) => s + a.x, 0) / its.length - w / 2);
    const cy = h / 2 + pull * (its.reduce((s, a) => s + a.y, 0) / its.length - h / 2);
    // Out along the spiral in steps of about four units of arc, so the
    // candidates are as close together at the rim as at the middle.
    let hit: Blot | undefined;
    for (let rho = 0, theta = phi; rho < w + h && !hit; theta += 4 / Math.max(rho, 4), rho = 3 * (theta - phi)) {
      const x = cx + rho * aspect * Math.cos(theta);
      const y = cy + (rho / aspect) * Math.sin(theta);
      if (x - r < EDGE || x + r > w - EDGE || y - r < EDGE || y + r > h - EDGE) continue;
      if (plate.keep.some((k) => toBox(x, y, k) < r + GAP)) continue;
      if (blots.every((b) => Math.hypot(b.x - x, b.y - y) >= b.r + r + gap)) hit = { ...item, x, y, r };
    }
    if (!hit) throw new Error(`no room on the ink plate for ${item.name}`);
    blots.push(hit);
  }
  return blots;
}
