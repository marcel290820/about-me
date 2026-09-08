import { test } from 'node:test';
import assert from 'node:assert/strict';
import { H, R_MAX, TALL, W, WIDE, anchors, layout, opened, radius, ring, toBox, wordSize, type Plate } from './drops.ts';

const DOMAINS = ['data', 'infra', 'web', 'web3', 'mobile'];
// More names than the sheets carry, with weights that run from one heavy
// pool down to the lightest the plate prints: a heavier plate than the real
// one, so the real one always fits.
const WORST = Array.from({ length: 60 }, (_, i) => ({
  name: String.fromCharCode(65 + (i % 26)).repeat(3 + ((i * 7) % 14)),
  weight: i === 0 ? 14 : i < 4 ? 6 : i < 12 ? 2 + (i % 3) : 1 + (i % 4) * 0.25,
  domains: i === 0 ? DOMAINS : [...new Set(DOMAINS.filter((_, k) => (i + k) % 3 === 0).concat(DOMAINS[i % DOMAINS.length]))],
}));

test('size follows weight within the limits', () => {
  assert.equal(radius(1), 15);
  // Above a half, so three times the work reads as plainly more, and
  // under one, so it is not three times the width; clear of the floor.
  assert.ok(radius(6) > radius(2) * Math.sqrt(3));
  assert.ok(radius(6) < radius(2) * 3);
  assert.equal(radius(100), R_MAX);
  // The floor is a logo's worth; the plate prints nothing under a sheet.
  assert.ok(radius(1.25) < radius(1.5));
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
      for (const k of plate.keep) assert.ok(toBox(a.x, a.y, k) > a.r, `${a.name} lies on a mark`);
      for (const b of blots) {
        if (a === b) continue;
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > a.r + b.r, `${a.name} and ${b.name} touch`);
      }
    }
  });
}

test('the layout is the same every time', () => {
  assert.deepEqual(layout(WORST, DOMAINS), layout(WORST, DOMAINS));
});
