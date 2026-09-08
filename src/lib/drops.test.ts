import { test } from 'node:test';
import assert from 'node:assert/strict';
import { H, R_MAX, R_MIN, TALL, W, WIDE, anchors, layout, opened, radius, ring, toCapsule, wordSize, type Plate } from './drops.ts';

const DOMAINS = ['data', 'infra', 'web', 'web3', 'mobile'];
// A quarter again as many names with a logo as the sheets carry, with
// weights that run from one heavy pool down to a sheet's work, and more
// droplets again under that: a heavier plate than the real one, so the
// real one always fits.
const WORST = Array.from({ length: 96 }, (_, i) => ({
  name: String.fromCharCode(65 + (i % 26)).repeat(3 + ((i * 7) % 14)),
  weight: i === 0 ? 14 : i === 1 ? 6 : i < 4 ? 4 : i < 12 ? 2 + (i % 3) : i < 46 ? 1 + (i % 4) * 0.25 : 0.25 + (i % 3) * 0.25,
  domains: i === 0 ? DOMAINS : [...new Set(DOMAINS.filter((_, k) => (i + k) % 3 === 0).concat(DOMAINS[i % DOMAINS.length]))],
}));

test('size follows weight within the limits', () => {
  // A sheet's work is the smallest blot with a logo; anything lighter is
  // a droplet, between a spatter speck and the smallest logo blot.
  assert.equal(radius(1), R_MIN);
  assert.ok(radius(0.25) > 4 && radius(0.75) < R_MIN - 2);
  assert.ok(radius(0.25) < radius(0.5) && radius(0.5) < radius(0.75));
  // The main stacks are plainly bigger than the rest, and not three
  // times the width; the spread between them matters less than a logo
  // reading, so the steps only have to climb.
  assert.ok(radius(6) > radius(2) * 1.5);
  assert.ok(radius(6) < radius(2) * 3);
  assert.equal(radius(100), R_MAX);
  assert.ok(radius(1) < radius(1.5) && radius(1.5) < radius(2) && radius(2) < radius(3));
});

test('an open blot holds its ring of domains and fits on the plate', () => {
  // The lightest blot with one domain opens no larger than the heaviest
  // lies at rest, so the area still reads once anyone has hovered.
  assert.ok(opened(radius(1), 1) < radius(100));
  assert.ok(opened(radius(1), 1) >= radius(1) * 1.4);
  // One word sits under the logo and must clear it, and the chord at its
  // ring must hold the longest word, MOBILE, at 57 units with the warp.
  const one = opened(radius(1), 1);
  assert.ok(one * ring(1) - (5 * wordSize(one)) / 10 >= 0.55 * radius(1) + 3);
  assert.ok(2 * one * Math.sqrt(1 - ring(1) ** 2) - 0.2 * one >= (57 * wordSize(one)) / 10);
  // With words beside the logo the ring needs more: the longest word, at
  // the size the pool letters it, must clear the logo's edge.
  const R = opened(radius(12.5), 5);
  assert.ok(R * ring(5) - (29 * wordSize(R)) / 10 >= 0.55 * radius(12.5) + 3);
  assert.ok(opened(radius(100), DOMAINS.length) * 2 < H);
  assert.ok(opened(radius(100), DOMAINS.length) * 2 < TALL.w);
});

test('a blot lies toward the domains it was used in', () => {
  const blots = layout(WORST, DOMAINS);
  const at = (dom: string) => anchors(DOMAINS).find((a) => a.domain === dom)!;
  // The heaviest blot is used in every domain and lies in the middle.
  const pool = blots.find((d) => d.weight === 14)!;
  assert.ok(Math.abs(pool.x - W / 2) < 60 && Math.abs(pool.y - H / 2) < 60);
  // A blot used in one domain only lies on that domain's side of the plate.
  for (const d of blots.filter((d) => d.domains.length === 1)) {
    const a = at(d.domains[0]);
    assert.ok((d.x - W / 2) * (a.x - W / 2) + (d.y - H / 2) * (a.y - H / 2) > 0, `${d.name} is across from ${a.domain}`);
  }
});

for (const [name, plate] of [['wide', WIDE], ['tall', TALL]] as [string, Plate][]) {
  test(`no blot touches another, the well or the quill, and all of it is on the ${name} plate`, () => {
    const blots = layout(WORST, DOMAINS, plate);
    assert.equal(blots.length, WORST.length);
    for (const a of blots) {
      assert.ok(a.x - a.r >= 0 && a.x + a.r <= plate.w && a.y - a.r >= 0 && a.y + a.r <= plate.h, `${a.name} off the plate`);
      for (const k of plate.keep) assert.ok(toCapsule(a.x, a.y, k) > a.r, `${a.name} lies on a mark`);
      for (const b of blots) {
        if (a === b) continue;
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > a.r + b.r, `${a.name} and ${b.name} touch`);
      }
    }
  });
}

test('the light blots are flung farther than the heavy ones, with more paper between them', () => {
  const blots = layout(WORST, DOMAINS);
  const pool = blots[0];
  const far = (b: (typeof blots)[number]) => Math.hypot(b.x - pool.x, b.y - pool.y);
  const mean = (bs: typeof blots) => bs.reduce((s, b) => s + far(b), 0) / bs.length;
  const heavy = blots.filter((b) => b.weight >= 4 && b !== pool);
  const light = blots.filter((b) => b.weight >= 1 && b.weight <= 1.25);
  assert.ok(mean(heavy) < mean(light), `heavy ${mean(heavy).toFixed(0)} lie past light ${mean(light).toFixed(0)}`);
  // The nearest neighbour of a far blot is farther off than a near one's.
  const nearest = (b: (typeof blots)[number]) => Math.min(...blots.filter((o) => o !== b).map((o) => Math.hypot(o.x - b.x, o.y - b.y) - o.r - b.r));
  const inner = blots.filter((b) => far(b) < 120 && b !== pool);
  const outer = blots.filter((b) => far(b) > 220);
  assert.ok(inner.length > 3 && outer.length > 3, `inner ${inner.length} outer ${outer.length}`);
  assert.ok(mean(inner) < mean(outer));
  const paper = (bs: typeof blots) => bs.reduce((s, b) => s + nearest(b), 0) / bs.length;
  assert.ok(paper(inner) < paper(outer), `inner keep ${paper(inner).toFixed(1)}, outer ${paper(outer).toFixed(1)}`);
});

test('the layout is the same every time', () => {
  assert.deepEqual(layout(WORST, DOMAINS), layout(WORST, DOMAINS));
});
