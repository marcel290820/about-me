// Builds public/og-default.png -- the card that shows in a Slack, LinkedIn or
// Twitter preview. It is the page held still: chart paper, the crossing, and
// the water under it.
//
// Two steps, because rendering needs a browser for the fonts:
//
//   node --experimental-strip-types scripts/og.mjs   # writes scripts/og.html
//   open scripts/og.html in a 1200x630 viewport and screenshot it to
//   public/og-default.png
//
// Geometry the site generates is imported from the site rather than re-typed,
// so the card cannot quietly drift away from the page it advertises. Type
// stripping is what lets a plain .mjs import curves.ts; Node 22 is already
// required by package.json.
import { writeFileSync } from 'node:fs';
import { spine, shell } from '../src/lib/curves.ts';

const W = 1200;
const H = 630;
const PAPER_H = 300;   // chart paper
const BAND_H = 140;    // the crossing
const DEEP_Y = PAPER_H + BAND_H;

// --- Swell trains, straight out of Waterline.astro -------------------------
const TILE = 1200;
const STEPS = 60;

function train(mid, harmonics) {
  const pts = [];
  for (let i = 0; i <= STEPS * 2; i++) {
    const t = (i / STEPS) * Math.PI * 2;
    let y = mid;
    for (const [k, amp, phase] of harmonics) y += Math.sin(t * k + phase) * amp;
    pts.push(`${((i / STEPS) * TILE).toFixed(1)} ${y.toFixed(1)}`);
  }
  return 'M' + pts.join('L');
}

// Same generator as the page, bigger amplitudes: the card is seen at about a
// third of the page's width, and the swell the page reads at full size flattens
// to a rule at that scale.
const far = train(50, [[1, 13, 2.4], [2, 6.5, 0.3], [5, 3, 1.7]]);
const near = train(96, [[1, 22, 0], [2, 11, 1.1], [3, 6, 2.3], [7, 4, 0.6]]);

// Contours printed across the paper, the way the surface zone carries them.
const contourA = train(58, [[1, 16, 0.8], [2, 7, 2.2], [4, 3, 1.1]]);
const contourB = train(128, [[1, 12, 2.9], [3, 6, 0.5], [6, 2.4, 1.9]]);

// --- Sperm whale, straight out of Drift.astro ------------------------------
const whale = spine({
  from: 44,
  to: 268,
  y: (t) => 62 - t * 5,
  up: [[0, 2], [0.08, 6], [0.34, 18], [0.6, 22], [0.72, 24], [0.95, 24], [1, 22]],
  down: [[0, 2], [0.08, 6], [0.36, 17], [0.62, 17], [0.78, 15], [0.92, 13], [1, 11]],
});
const whaleBody = shell(whale);

// --- Buoy mooring, straight out of Shallows.astro --------------------------
const CHAIN = Array.from({ length: 13 }, (_, i) => {
  const y = 120 + i * 8;
  const rx = i % 2 ? 3.6 : 1.2;
  return `M${(60 - rx).toFixed(1)} ${y}a${rx} 5 0 0 1 ${rx * 2} 0a${rx} 5 0 0 1 ${-rx * 2} 0`;
}).join('');

const CORD = Array.from({ length: 6 }, (_, i) => {
  const y = 240 + i * 14;
  const a = i % 2 ? 52 : 68;
  const b = i % 2 ? 74 : 46;
  return `M${a} ${y}C${b} ${y + 4} ${b} ${y + 10} ${a} ${y + 14}`;
}).join('');

const GROWTH =
  'M36 78c-3 6-2 11 1 15M44 82c-2 7 0 12 3 15M52 84c-3 6-3 12 0 16' +
  'M60 84c-1 7 1 12 4 15M68 83c-3 6-3 11 0 15M76 79c-2 6-1 11 2 14';

// --- Marine snow -----------------------------------------------------------
// Seeded, so the card is byte-identical every time it is regenerated.
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(20260810);
const snow = Array.from({ length: 170 }, () => {
  const x = rand() * W;
  const y = 4 + rand() * (H - DEEP_Y - 8);
  const r = 0.7 + rand() * 1.7;
  const o = 0.2 + rand() * 0.38;
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#eae3d3" opacity="${o.toFixed(2)}"/>`;
}).join('');

// Printed depth marks along the crossing, the same as the page prints on the
// waterline. Chart data: the sea moves under them.
const bandMarks = [70, 196, 330, 468, 604, 742, 878, 1016, 1148]
  .map((x, i) => `<circle cx="${x}" cy="${112 + (i % 3) * 9}" r="2" fill="#e4572e" opacity="0.5"/>`)
  .join('');

// Printed soundings on the paper, thin the way the page prints them.
const SOUNDINGS = [[884, 74, 22], [1012, 186, 9], [946, 252, 31], [806, 128, 14]];
const soundings = SOUNDINGS.map(
  ([x, y, v]) => `<text x="${x}" y="${y}" class="sd">${v}</text>`,
).join('');

const html = `<style>
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; overflow: hidden; background: #f1ecdf; }
  .card { position: relative; width: ${W}px; height: ${H}px; }

  .paper { position: absolute; inset: 0 0 ${H - PAPER_H}px 0; background: #f1ecdf; }
  .band  { position: absolute; top: ${PAPER_H}px; left: 0; right: 0; height: ${BAND_H}px;
           overflow: hidden;
           background: linear-gradient(to bottom,
             #f1ecdf 0%, #f1ecdf 16%, #b9c3b8 38%, #5b8288 58%,
             #1c4750 76%, #06141b 94%, #06141b 100%); }
  .deep  { position: absolute; top: ${DEEP_Y}px; left: 0; right: 0; bottom: 0; background: #06141b; }

  .band svg { position: absolute; top: 0; left: 0; width: 200%; height: 100%; }
  .band .far  { transform: translateX(-14%); }
  .band .near { transform: translateX(-41%); }
  .band .marks { transform: none; width: 100%; }

  .contours { position: absolute; top: 0; left: 0; width: 100%; height: ${PAPER_H}px; }

  .copy { position: absolute; top: 58px; left: 78px; }
  .eyebrow { display: flex; align-items: center; gap: 14px;
             font-family: 'IBM Plex Mono', monospace; font-size: 15px; font-weight: 500;
             letter-spacing: 0.19em; text-transform: uppercase; color: #10222e; }
  .eyebrow i { display: block; width: 34px; height: 2px; background: #e4572e; }
  .name { margin-top: 20px; font-family: Archivo, sans-serif; font-stretch: 125%;
          font-weight: 700; text-transform: uppercase; letter-spacing: -0.03em;
          line-height: 0.9; font-size: 76px; color: #10222e; }
  .role { margin-top: 18px; font-family: Archivo, sans-serif; font-stretch: 100%;
          font-weight: 400; font-size: 25px; letter-spacing: 0.005em; color: #3d5561; }

  .sd { font-family: 'IBM Plex Mono', monospace; font-size: 15px; fill: #7c8b93; opacity: 0.62; }
  .marks { position: absolute; inset: 0; }

  .site { position: absolute; right: 72px; bottom: 46px;
          font-family: 'IBM Plex Mono', monospace; font-size: 16px; font-weight: 500;
          letter-spacing: 0.17em; text-transform: uppercase; color: #7fd1c0; }

  .buoy  { position: absolute; left: 84px; top: ${PAPER_H + 74}px; width: 74px; }
  .whale { position: absolute; left: 402px; top: ${DEEP_Y + 22}px; width: 392px; opacity: 0.42; }
  .buoy svg, .whale svg { display: block; width: 100%; height: auto; overflow: visible; }
</style>

<div class="card">
  <div class="paper"></div>

  <svg class="contours" viewBox="0 0 2400 ${PAPER_H}" preserveAspectRatio="none" fill="none">
    <path d="${contourA}" stroke="#7c8b93" stroke-width="1.4" opacity="0.3" vector-effect="non-scaling-stroke"/>
    <path d="${contourB}" stroke="#7c8b93" stroke-width="1.4" opacity="0.22" vector-effect="non-scaling-stroke"/>
  </svg>

  <svg class="marks" viewBox="0 0 ${W} ${H}" fill="none">
    ${soundings}
    <g stroke="#7c8b93" stroke-width="1" opacity="0.45">
      <path d="M74 40v-18M74 22h22"/>
      <path d="M1126 40v-18M1126 22h-22"/>
    </g>
    <g stroke="#eae3d3" stroke-width="1" opacity="0.3">
      <path d="M74 590v18M74 608h22"/>
      <path d="M1126 590v18M1126 608h-22"/>
    </g>
  </svg>

  <div class="band">
    <svg class="far" viewBox="0 0 2400 ${BAND_H}" preserveAspectRatio="none" fill="none">
      <path d="${far}" stroke="#e4572e" stroke-width="1.6" opacity="0.42" vector-effect="non-scaling-stroke"/>
    </svg>
    <svg class="near" viewBox="0 0 2400 ${BAND_H}" preserveAspectRatio="none" fill="none">
      <path d="${near}" stroke="#e4572e" stroke-width="2" vector-effect="non-scaling-stroke"/>
    </svg>
    <svg class="marks" viewBox="0 0 1200 ${BAND_H}" preserveAspectRatio="none" fill="none">
      ${bandMarks}
    </svg>
  </div>

  <div class="deep">
    <svg viewBox="0 0 ${W} ${H - DEEP_Y}" style="position:absolute;inset:0;width:100%;height:100%">
      ${snow}
    </svg>
  </div>

  <div class="buoy">
    <svg viewBox="0 0 120 460" fill="none" stroke="#eae3d3" stroke-width="1.4" opacity="0.78">
      <defs>
        <linearGradient id="mf" gradientUnits="userSpaceOnUse" x1="60" y1="352" x2="60" y2="450">
          <stop offset="0" stop-color="#eae3d3" stop-opacity="0.7"/>
          <stop offset="1" stop-color="#eae3d3" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g stroke="#10222e" opacity="0.7">
        <path d="M50 4 70 20M70 4 50 20" stroke-width="1.6"/>
        <path d="M52 52V28M68 52V28" stroke-width="1.2"/>
        <path d="M52 48 68 42 52 36 68 30" stroke-width="0.8" opacity="0.7"/>
        <circle cx="60" cy="25" r="3" fill="#e4572e" stroke="none"/>
      </g>
      <path d="M26 46C26 70 41 84 60 84C79 84 94 70 94 46Z"/>
      <path d="M27 58h66" stroke-width="0.7" opacity="0.5"/>
      <path d="${GROWTH}" stroke-width="0.7" opacity="0.6"/>
      <path d="M52 84h16v16h-16z" stroke-width="1.1"/>
      <path d="M52 100C52 106 56 110 60 110C64 110 68 106 68 100" stroke-width="1.1"/>
      <circle cx="60" cy="92" r="2.6" fill="#7fd1c0" stroke="none"/>
      <path d="M60 110v4" stroke-width="0.8"/>
      <circle cx="60" cy="117" r="4" stroke-width="1"/>
      <path d="${CHAIN}" stroke-width="0.9"/>
      <circle cx="60" cy="224" r="2.4" stroke-width="0.8"/>
      <path d="M57 228h6v10h-6z" stroke-width="0.8"/>
      <path d="${CORD}" stroke-width="0.8" opacity="0.85"/>
      <path d="M60 324v6" stroke-width="0.8"/>
      <circle cx="60" cy="341" r="11" stroke-width="1"/>
      <path d="M60 352V460" stroke="url(#mf)" stroke-width="0.9"/>
    </svg>
  </div>

  <div class="whale">
    <svg viewBox="-10 24 310 82" fill="none" stroke="#eae3d3" stroke-width="1.1">
      <path d="${whaleBody}"/>
      <path d="M250 34.6c2-2.4 5-2.4 7 0" stroke-width="0.8"/>
      <path d="M206 73C226 74 246 73 259 70v3c-13 3-33 5-51 4Z" stroke-width="0.9"/>
      <path d="M218 73.4v2.6M226 73.6v2.6M234 73.4v2.6M242 73v2.6M250 72.4v2.6" stroke-width="0.6" opacity="0.7"/>
      <circle cx="214" cy="58" r="1.9" fill="#eae3d3" stroke="none" opacity="0.85"/>
      <path d="M140 41c4-5 9-6 14-2" stroke-width="0.9"/>
      <path d="M124 43c4-4 8-4 11-1M108 45c3-3 7-3 10 0M94 47c3-3 6-3 9 0" stroke-width="0.8"/>
      <path d="M196 72c-2 12-8 20-16 24 0-10 5-19 12-24Z" stroke-width="0.9"/>
      <path d="M46 60C30 44 8 34-6 36c12 10 18 18 18 24 0 7-6 16-20 28 16 2 36-10 52-26Z"/>
      <path d="M40 56C26 46 12 42 2 42" stroke-width="0.6" opacity="0.55"/>
      <path d="M60 52c-8 4-12 8-14 12" stroke-width="0.6" opacity="0.5"/>
    </svg>
  </div>

  <div class="copy">
    <div class="eyebrow"><i></i>Berlin &middot; 52-31N 013-24E</div>
    <div class="name">Marcel<br/>Heidebrecht</div>
    <div class="role">Fullstack engineer &amp; DevOps enthusiast</div>
  </div>

  <div class="site">marcel-heidebrecht.de</div>
</div>
`;

writeFileSync(new URL('./og.html', import.meta.url), html);
console.log('wrote scripts/og.html -- screenshot it at 1200x630');
