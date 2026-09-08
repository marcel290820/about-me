// The ink: one blot per stack name, its area the weight of use across
// every sheet. Nothing is lettered on the paper: the domains a stack was
// used in are reversed out of its blot when it opens on hover. Position is
// two readings at once. The quieter one is the domain: a blot is pulled
// from the plate's middle toward the side its domains own, so the data
// stacks lie together and a stack used everywhere lies in the middle, and
// opening a few neighbours confirms it. The louder one is the spill: the
// heavy blots lie close round the pool the well poured, and the light
// ones are flung farthest, with more paper between them the farther they
// flew, because that is how a splash falls (the smallest drops fly
// farthest) and a plate with the same paper between every blot is a
// chart.
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

// A capsule: the paper round a segment. The marks keep their paper as
// capsules, since a bottle and a feather are long things and a box round
// a feather lying askew is mostly empty paper the blots would have to
// keep off, and the shove in the browser would stop at its invisible
// wall.
export type Capsule = { a: [number, number]; b: [number, number]; r: number };
// The marks that tell the story of the spill: the inkwell that went over
// in the swell, and the quill dropped with its nib in the ink. Each is
// drawn in its own box, in plate units, and placed by an origin on the
// plate with a turn about it: the well's origin is its mouth, which is
// where the ink runs out toward the pool, and the quill's is its nib,
// which is where its skid through the wet ink ends. The capsules are in
// the mark's own units; `placed()` turns them onto a plate.
export type Put = { x: number; y: number; rot: number };
export type Mark = { w: number; h: number; origin: [number, number]; keep: Capsule[]; wide: Put; tall: Put };
export const WELL: Mark = {
  w: 100,
  h: 80,
  origin: [57, 40],
  // The body, the stopper, and the ring the lip printed where the mouth
  // came down before the bottle rolled onto its side.
  keep: [
    { a: [18, 40], b: [50, 40], r: 17 },
    { a: [34, 70], b: [44, 70], r: 7 },
    { a: [64, 64], b: [64, 64], r: 12 },
  ],
  wide: { x: 226, y: 214, rot: 14 },
  // On the tall plate the well lies at the top, tipped down the column,
  // so the spill runs down from its mouth the way gravity and a tall
  // plate agree: at the side, the ink stood a screen above the mouth.
  tall: { x: 118, y: 128, rot: 62 },
};
export const QUILL: Mark = {
  w: 200,
  h: 60,
  origin: [6, 48],
  keep: [
    { a: [6, 48], b: [101, 39], r: 13 },
    { a: [101, 39], b: [196, 16], r: 13 },
  ],
  wide: { x: 294, y: 308, rot: 155 },
  tall: { x: 89, y: 323, rot: 105 },
};
// A point in a mark's own units, on the plate the mark is put on.
export const onPlate = (m: Mark, put: Put, [x, y]: [number, number]): [number, number] => {
  const a = (put.rot * Math.PI) / 180;
  const dx = x - m.origin[0];
  const dy = y - m.origin[1];
  return [put.x + dx * Math.cos(a) - dy * Math.sin(a), put.y + dx * Math.sin(a) + dy * Math.cos(a)];
};
const placed = (m: Mark, put: Put): Capsule[] => m.keep.map((c) => ({ a: onPlate(m, put, c.a), b: onPlate(m, put, c.b), r: c.r }));

// A plate: its size, the paper on it the blots keep clear of, where the
// inkwell and the quill lie, and the well's mouth, which the spill runs
// out of.
export type Plate = { w: number; h: number; keep: Capsule[]; mouth: [number, number] };
export const W = 720;
export const H = 460;
export const WIDE: Plate = { w: W, h: H, keep: [...placed(WELL, WELL.wide), ...placed(QUILL, QUILL.wide)], mouth: [WELL.wide.x, WELL.wide.y] };
export const TALL: Plate = { w: 360, h: 760, keep: [...placed(WELL, WELL.tall), ...placed(QUILL, QUILL.tall)], mouth: [WELL.tall.x, WELL.tall.y] };
const EDGE = 8;
const EDGE_SHARE = 0.4;
// Paper kept between blots at rest: the least of it, how much more a
// blot may keep, hashed from its name, so some lie close and some clear,
// how the whole of it grows with distance from the mouth, so the spill
// is tight round its source and thins out to where the last drops fell,
// and how much wider it is behind the mouth than ahead of it, so less
// lands behind the bottle than in front. A droplet keeps half of it. An
// open blot shoves its neighbours aside in the browser, so the packing
// keeps no room for it.
const GAP = 6;
const SLACK = 20;
const THIN = 1.5;
const THIN_OVER = 360;
const BEHIND = 0.7;
// How far a blot's middle is pulled from the plate's middle toward the
// domains it was used in: the lightest a long way, the heavy ones hardly
// at all, since in a splash the smallest drops fly farthest, plus a span
// hashed from the name, so a few land well past the rest and the ink's
// outline is not a lens with an even margin. And how far the lightest
// are carried on along the line the ink went out of the mouth, since
// what a pour threw went on the way it was going.
const FLUNG_LIGHT = 0.9;
const FLUNG_HEAVY = 0.3;
const FLUNG_OVER = 3;
const PULL_SPAN = 0.3;
const DRIFT = 36;
// How far the ink ran from the mouth before it pooled: the pool's rim
// lies this far along the axis. A pool placed by its domains alone lay
// wherever their mean fell, and on the tall plate that was half the
// column below the bottle.
const RUN = 64;
// Size by weight: r = R_K * w^R_EXP, between the limits. Area in
// proportion to weight is what the eye reads as less than proportion, so
// the exponent sits well above a half, and every step the sheets take is
// a step the eye can see: a sheet and a half is plainly more than a
// sheet, two plainly more than a sheet and a half. The floor is the
// smallest blot a logo reads out of with ink round it, and a name with a
// sheet's work behind it gets a logo. Anything lighter is a droplet: no
// logo, since there is no room for one, and no words, since a plate of
// what was touched in passing is not what the top of the page is for,
// but printed, because a spill has a bottom to its size scale and a
// plate that stops at the smallest logo is a plate of pebbles.
export const LABELLED = 1;
export const R_MIN = 12;
export const R_MAX = 58;
const R_K = 11.5;
const R_EXP = 0.8;
const R_DROP = 3;
const R_DROP_K = 6;
const DROP_SPREAD_LOW = 0.75;
const DROP_SPREAD = 0.5;

export type Weighed = { name: string; weight: number; domains: string[] };
export type Blot = Weighed & { x: number; y: number; r: number };
export type Anchor = { domain: string; x: number; y: number };

export const radius = (weight: number) => (weight < LABELLED ? R_DROP + R_DROP_K * weight : Math.min(R_MAX, Math.max(R_MIN, R_K * Math.pow(weight, R_EXP))));

// The ring the domains letter on, as a fraction of the open radius, and
// what has to fit between it and the logo: half a word's height when the
// words sit above and below the logo, and half the longest domain word
// (with the rim's warp and the word's own jitter off the ring) when there
// are more than two and some sit beside it. A single word sits under the
// logo on a tighter ring, so the pool is what one word needs and not a
// ring with one word on it. The logo is 1.1 r across.
const RING = 0.6;
const RING_ONE = 0.45;
const WORD_H = 5;
const WORD_SIDE = 30;
// The chord the longest word needs at its ring, with the rim's warp (an
// open pool keeps a pool's crust, up to six units in) and the word's own
// tilt off plumb and jitter off the ring: on the wide ring and on the
// tight one. At forty the phone's two-word pools lettered out over the
// rim.
const CHORD = 54;
const CHORD_ONE = 40;
export const ring = (domains: number) => (domains === 1 ? RING_ONE : RING);
// The words are lettered at ten units in a small pool and grow with it, to
// thirteen, so a wide pool is not ringed in fine print.
export const wordSize = (R: number) => Math.min(12, Math.max(10, 10 + 0.08 * (R - 40)));
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

// A point's distance to a capsule's edge: negative inside it.
export const toCapsule = (x: number, y: number, c: Capsule) => {
  const dx = c.b[0] - c.a[0];
  const dy = c.b[1] - c.a[1];
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.min(1, Math.max(0, ((x - c.a[0]) * dx + (y - c.a[1]) * dy) / l2));
  return Math.hypot(x - c.a[0] - dx * t, y - c.a[1] - dy * t) - c.r;
};

// FNV-1a, 32 bit, the same as the sheet's.
export const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};

// The line the ink went out along: from the well's mouth to the plate's
// middle, where the pool lies.
export function axisOf(plate: Plate): [number, number] {
  const dx = plate.w / 2 - plate.mouth[0];
  const dy = plate.h / 2 - plate.mouth[1];
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}

// Where each domain pulls toward: on an ellipse well inside the frame so
// a cluster of one domain's stacks has room to spread round its anchor,
// spread over a fan ahead of the mouth, the first domain at one end and
// the last at the other, so no domain's stacks are asked to lie behind
// the bottle: a spill goes the way it was poured, and ringed evenly
// round the pool it was a scatter with a bottle in it.
const ORBIT = 0.36;
const FAN = (200 * Math.PI) / 180;
export function anchors(domains: string[], plate: Plate = WIDE): Anchor[] {
  const [ax, ay] = axisOf(plate);
  const along = Math.atan2(ay, ax);
  return domains.map((domain, i) => {
    const a = along + FAN * (domains.length > 1 ? i / (domains.length - 1) - 0.5 : 0);
    return { domain, x: plate.w / 2 + ORBIT * plate.w * Math.cos(a), y: plate.h / 2 + ORBIT * plate.h * Math.sin(a) };
  });
}

// How light a blot is, from a sheet's work or less (1) to the heavy end
// (0): what decides how far it is flung.
const lightness = (weight: number) => 1 - Math.min(1, Math.max(0, (weight - 1) / FLUNG_OVER));

export function layout(items: Weighed[], domains: string[], plate: Plate = WIDE): Blot[] {
  const { w, h, mouth } = plate;
  const pulls = anchors(domains, plate);
  // The spiral leans with the plate, so the cluster fills it rather than
  // reading as a lens in a landscape or a column in a portrait.
  const aspect = Math.sqrt(w / h);
  const axis = axisOf(plate);
  const blots: Blot[] = [];
  // Heaviest first, so the pool takes the middle and the rest fit round
  // it; ties by name so the order is stable.
  const order = [...items].sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
  for (const item of order) {
    const droplet = item.weight < LABELLED;
    // A droplet's size is spread by a hash as well as its weight, so the
    // bottom of the scale runs from a speck to a drop and not one size.
    const r = radius(item.weight) * (droplet ? DROP_SPREAD_LOW + (DROP_SPREAD * ((hash(item.name) >>> 20) % 101)) / 100 : 1);
    const light = lightness(item.weight);
    const phi = (hash(item.name) % 360) * (Math.PI / 180);
    const slack = (GAP + ((hash(item.name) >>> 9) % (SLACK + 1))) * (droplet ? 0.5 : 1);
    const its = pulls.filter((a) => item.domains.includes(a.domain));
    if (!its.length) throw new Error(`${item.name} was used in no domain on the plate`);
    const pull = FLUNG_HEAVY + (FLUNG_LIGHT - FLUNG_HEAVY) * light + (PULL_SPAN * ((hash(item.name) >>> 16) % 101)) / 100;
    // The pool lies a run of ink from the mouth along the axis, since the
    // ink ran out of the bottle and pooled where it stopped; the rest lie
    // round it by their domains.
    const first = !blots.length;
    const cx = first ? mouth[0] + axis[0] * (RUN + r) : w / 2 + DRIFT * light * axis[0] + pull * (its.reduce((s, a) => s + a.x, 0) / its.length - w / 2);
    const cy = first ? mouth[1] + axis[1] * (RUN + r) : h / 2 + DRIFT * light * axis[1] + pull * (its.reduce((s, a) => s + a.y, 0) / its.length - h / 2);
    // Out along the spiral in steps of about four units of arc, so the
    // candidates are as close together at the rim as at the middle.
    let hit: Blot | undefined;
    for (let rho = 0, theta = phi; rho < w + h && !hit; theta += 4 / Math.max(rho, 4), rho = 3 * (theta - phi)) {
      const x = cx + rho * aspect * Math.cos(theta);
      const y = cy + (rho / aspect) * Math.sin(theta);
      // Clear of the edge by a share of its own radius on top of the
      // margin, so what crosses the column's edge is spatter and not a
      // blot sliced flat: a straight cut on a blot prints the frame.
      const m = EDGE + EDGE_SHARE * r;
      if (x - r < m || x + r > w - m || y - r < m || y + r > h - m) continue;
      if (plate.keep.some((k) => toCapsule(x, y, k) < r + GAP)) continue;
      // The paper this spot keeps: more the farther from the mouth, and
      // more again behind it.
      const dx = x - mouth[0];
      const dy = y - mouth[1];
      const dist = Math.hypot(dx, dy) || 1;
      const behind = Math.max(0, -(dx * axis[0] + dy * axis[1]) / dist);
      const gap = slack * (1 + (THIN - 1) * Math.min(1, dist / THIN_OVER)) * (1 + BEHIND * behind);
      if (blots.every((b) => Math.hypot(b.x - x, b.y - y) >= b.r + r + gap)) hit = { ...item, x, y, r };
    }
    if (!hit) throw new Error(`no room on the ink plate for ${item.name}`);
    blots.push(hit);
  }
  return blots;
}
