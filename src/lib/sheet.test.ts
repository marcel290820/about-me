import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ICON, TALL, WIDE, layout, type Box, type Mark, type Plate } from './sheet.ts';

// A name prints at 11 units in the plate's mono face with 0.04em tracking:
// about 7.04 units a character, 11 tall, run from its anchor. A logo is an
// ICON square about its centre. A bearing's degrees are three characters at
// 7.5 units, centred on their point, and print only where names do.
const boxes = (m: Mark, plate: Plate): Box[] => {
  const out: Box[] = [];
  if (plate.names) {
    const w = m.name.length * 7.04;
    const x0 = m.text.anchor === 'end' ? m.text.x - w : m.text.x;
    out.push({ x0, x1: x0 + w, y0: m.text.y - 11, y1: m.text.y });
    out.push({ x0: m.degree.x - 11, x1: m.degree.x + 11, y0: m.degree.y - 9, y1: m.degree.y + 3 });
  }
  if (m.icon) {
    const h = ICON / 2;
    out.push({ x0: m.icon.x - h, x1: m.icon.x + h, y0: m.icon.y - h, y1: m.icon.y + h });
  }
  return out;
};
const apart = (a: Box, b: Box) => a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0;
const inside = (x: number, y: number, b: Box, margin: number) =>
  x > b.x0 - margin && x < b.x1 + margin && y > b.y0 - margin && y < b.y1 + margin;

// The widest names the schema allows: sixteen characters each.
const WORST = Array.from({ length: 8 }, (_, i) => String.fromCharCode(65 + i).repeat(16));
// A spread of titles moves the fix and the grid around their ranges.
const TITLES = ['a', 'Prediction markets on Solana', 'zz top', 'Observability for a platform', 'Health app', 'x9'];
// Every name with a logo, none, and every other one.
const LOGOS: [string, (name: string) => boolean][] = [
  ['all logos', () => true],
  ['no logos', () => false],
  ['alternating', (name) => name.charCodeAt(0) % 2 === 0],
];
const PLATES: [string, Plate][] = [
  ['wide', WIDE],
  ['tall', TALL],
];

const every = (fn: (plate: Plate, n: number, title: string, label: string, hasLogo: (name: string) => boolean) => void) => {
  for (const [pl, plate] of PLATES)
    for (const n of [3, 4, 5, 6, 7, 8])
      for (const title of TITLES)
        for (const [label, hasLogo] of LOGOS) fn(plate, n, title, `${pl}, ${n} names, ${label}, "${title}"`, hasLogo);
};

test('eight names take every edge: three top, two right, one bottom, two left', () => {
  const { marks } = layout('Prediction markets on Solana', WORST, () => true);
  const count = (edge: string) => marks.filter((m) => m.edge === edge).length;
  assert.deepEqual([count('top'), count('right'), count('bottom'), count('left')], [3, 2, 1, 2]);
});

test('nothing leaves the frame, touches another mark, or covers the title block', () => {
  every((plate, n, title, where, hasLogo) => {
    const all = layout(title, WORST.slice(0, n), hasLogo, plate).marks.flatMap((m, i) =>
      boxes(m, plate).map((b) => ({ ...b, mark: i })),
    );
    for (const [i, a] of all.entries()) {
      assert.ok(a.x0 >= 0 && a.x1 <= plate.w && a.y0 >= 0 && a.y1 <= plate.h, `mark ${a.mark} leaves the frame (${where})`);
      assert.ok(apart(a, plate.block), `mark ${a.mark} covers the title block (${where})`);
      for (const b of all.slice(i + 1)) {
        if (b.mark === a.mark) continue;
        assert.ok(apart(a, b), `mark ${a.mark} touches mark ${b.mark} (${where})`);
      }
    }
  });
});

test('no bearing crosses another mark or the title block', () => {
  every((plate, n, title, where, hasLogo) => {
    const { fix, marks } = layout(title, WORST.slice(0, n), hasLogo, plate);
    const all = marks.map((m) => boxes(m, plate));
    marks.forEach((m, i) => {
      for (let s = 0; s <= 60; s++) {
        const t = s / 60;
        const x = m.from.x + (fix.x - m.from.x) * t;
        const y = m.from.y + (fix.y - m.from.y) * t;
        assert.ok(!inside(x, y, plate.block, 1), `bearing ${i} crosses the title block (${where})`);
        all.forEach((bs, j) => {
          if (j === i) return;
          for (const b of bs) assert.ok(!inside(x, y, b, 1), `bearing ${i} crosses mark ${j} (${where})`);
        });
      }
    });
  });
});

test('bearings read true, north up, from the fix to the mark', () => {
  const { fix, marks } = layout('Prediction markets on Solana', WORST, () => true);
  for (const m of marks) {
    assert.ok(m.bearing >= 0 && m.bearing < 360, `bearing ${m.bearing}`);
    // Top marks lie north of the fix, right marks east of it, and so on.
    const quadrant = { top: [300, 60], right: [30, 150], bottom: [120, 240], left: [210, 330] }[m.edge];
    const inArc = quadrant[0] < quadrant[1]
      ? m.bearing >= quadrant[0] && m.bearing <= quadrant[1]
      : m.bearing >= quadrant[0] || m.bearing <= quadrant[1];
    assert.ok(inArc, `${m.edge} mark reads ${m.bearing}`);
    assert.ok(Math.abs(m.degree.rotate) <= 90, `degrees upside down on ${m.edge}`);
  }
  assert.ok(fix.x > 0 && fix.y > 0);
});

test('the fix and the grid are deterministic and inside their ranges', () => {
  for (const [, plate] of PLATES) {
    const a = layout('Prediction markets on Solana', WORST, () => true, plate);
    const b = layout('Prediction markets on Solana', WORST, () => true, plate);
    assert.deepEqual(b.fix, a.fix);
    assert.deepEqual(b.grid, a.grid);
    assert.ok(a.fix.x >= plate.fixX[0] && a.fix.x <= plate.fixX[1], `fix x ${a.fix.x}`);
    assert.ok(a.fix.y >= plate.fixY[0] && a.fix.y <= plate.fixY[1], `fix y ${a.fix.y}`);
    for (const x of a.grid.x) assert.ok(x > 0 && x < plate.w, `grid x ${x}`);
    for (const y of a.grid.y) assert.ok(y > 0 && y < plate.h, `grid y ${y}`);
  }
});

test('a stack outside three to eight names is refused', () => {
  assert.throws(() => layout('t', WORST.slice(0, 2), () => true));
  assert.throws(() => layout('t', [...WORST, 'I'], () => true));
});
