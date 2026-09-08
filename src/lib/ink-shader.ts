// The ink on the paper, in the browser. A fragment shader draws every blot
// as a distance field: a drop longer one way than the other, lopsided by
// seeded harmonics, with a lobe or two where it splashed on some, a crust
// of noise round the rim, a thread of a tail off a few small ones and a
// few specks of spatter thrown clear of most, merged softly with its
// neighbours so two that come close join with a neck, a crisp edge and a
// thin dark bank where it dried. Nothing outside the edge: a feather, a
// halo, a sheen and a print
// ghost were each tried and each read as a shadow, and the chart has
// none. The canvas is clear where there is no ink and bleeds past the
// field, so the page's own paper shows through and nothing is cut
// straight: the spill has no edge. The hovered blot opens: its radius
// springs out to what the plate drew it to open to, its neighbours are
// shoved clear on a spring of their own and pass the shove on, it merges
// with them more readily than they do with each other so they pull apart
// with a neck, and slow waves run through it from the pointer. The logos
// and the domain words are HTML over the canvas, moved through --px, --py
// and --R, so this file owns motion and the CSS owns everything the words
// look like.
//
// Contract: mount(plate) reads every .blot's --x, --y (the wide plate),
// --xp, --yp (the tall one, below `sm`), --r, data-open, data-seed and
// data-t, and takes over from there. It draws nothing until a quarter of
// the plate is in frame, then lands the blots one by one. Without WebGL
// it sets `is-flat` on the plate and still runs the springs, so the discs
// the CSS prints instead open the same way. Under reduced motion every
// spring jumps to its target and the waves stop. Nothing here throws
// after mount: a lost context leaves the last frame.
import { TALL, WIDE } from './drops';

// Paper kept round an open blot: from the plate's edge, and to a shoved
// neighbour, a cap height plus a share of both radii for the rims' warp,
// so the pool gets a clean field for its words.
const EDGE = 8;
const GAP = 10;
const WARP = 0.1;
// How long a blot takes to land, the plate's share in frame that starts
// it, and the bloom: once the last blot is down the heaviest opens by
// itself and closes again, which is how a pointer learns what the plate
// does without being told.
const LAND = 0.6;
const IN_FRAME = 0.25;
const BLOOM_AT = 1500;
const BLOOM_FOR = 2200;
// The springs, per second: how fast a blot swells, how hard it is pulled
// to where it should be and how it is damped (near critical: thick ink
// settles, it does not bounce), and how fast the waves fade in.
const SWELL = 7;
const PULL = 120;
const DAMP = 18;
const WAKE = 5;
// Where the tall plate takes over from the wide one; the CSS's own query.
const TALL_AT = '(width < 40rem)';

type Blot = {
  el: HTMLElement;
  wide: [number, number];
  tall: [number, number];
  x: number;
  y: number;
  r: number;
  open: number;
  seed: number;
  t: number;
  px: number;
  py: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  swell: number;
  land: number;
};

const VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }';

const frag = (n: number) => `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float u_scale, u_time, u_hoverT, u_poured;
uniform vec2 u_ptr, u_view, u_off;
uniform vec4 u_run;
uniform int u_hover;
uniform vec4 u_blot[${n}];
uniform float u_swell[${n}];
uniform vec3 u_paper, u_ink;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// A blot's own draws, from its seed (a hundredth of an integer) and a
// purpose: each purpose an irrational multiplier, so the draws are spread
// and not in step with each other. The sin hash above, fed the seed, put
// nearly every tail on one bearing.
float draw(float s, int k){
  float m = floor(s*100. + .5);
  if (k == 0) return fract(m*.61803398875);
  if (k == 1) return fract(m*.75487766625);
  if (k == 2) return fract(m*.56984029099);
  return fract(m*.44823914305);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a*noise(p); p = p*2.03 + 17.3; a *= .5; } return v; }
float smin(float a, float b, float k){ float h = clamp(.5 + .5*(b-a)/k, 0., 1.); return mix(b, a, h) - k*h*(1.-h); }
mat2 turn(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
// A blot's edge, at radius r, spilled at radius r0. The drop is longer
// one way than the other by a seeded share, turned by the seed, and
// lopsided by four harmonics whose weights are seeded too, so no two
// blots are the same species: strong on a small blot, which is a drop
// and smooth but never round, faint on a big one. Some have a lobe or
// two where the ink splashed, broad and low, at a seeded bearing: a
// sharp one is a speech bubble's tail. The crust is noise: lobes round
// the rim, as many per unit of rim on a pool as on a drop, sampled on a
// circle so the rim closes without a seam, and a broader lean over the
// area, which the big blots carry and the small ones barely. The warp
// grows at two thirds the rate the pool does as it opens: a pool that
// has spread is smoother than the drop it was, and the words need the
// clean field, but a pool with a flat rim is a disc.
float blot(vec2 q, float r, float r0, float s){
  float h1 = draw(s, 0), h2 = draw(s, 1), h3 = draw(s, 2), h4 = draw(s, 3);
  q = turn(h4*6.2832) * q;
  // The stretch is the spilled drop's, in units, not a share of the pool.
  q.x /= 1. + (.06 + .3*h3)*r0/r;
  float l = max(length(q), 1e-3);
  vec2 c = q / l;
  float a = atan(q.y, q.x);
  float small = 1. - smoothstep(14., 40., r0);
  float body = (.03 + .10*small*h1)*cos(2.*a - s*3.1) + (.02 + .08*small)*cos(3.*a - s*5.3)
             + (.02 + .05*h2)*cos(4.*a + s*7.7) + .03*h3*cos(5.*a - s*2.2);
  float lobe = 0.;
  if (h3 > .45) {
    float a0 = h2*6.2832;
    lobe += (.10 + .18*h1) * pow(max(cos(a - a0), 0.), 6. + 10.*h2);
    if (h1 > .5) lobe += (.06 + .12*h3) * pow(max(cos(a - a0 - 2.1 - 1.5*h4), 0.), 9.);
  }
  float w1 = fbm(c*(.8 + r/40.) + s*5.) - .5;
  float w2 = fbm(q*.07 + s*9.) - .5;
  float crust = (.06 + .12*(1.-small))*w1 + (.05 + .08*(1.-small))*w2;
  return l - r - (r0 + .65*(r - r0))*(body + lobe + crust);
}
// A speck of spatter: a small drop, lopsided, no noise, which at its size
// no one would see.
float speck(vec2 q, float r, float s){
  float l = max(length(q), 1e-3);
  float a = atan(q.y, q.x);
  return l - r*(1. + .12*cos(2.*a - s*3.) + .08*cos(3.*a + s*5.));
}
// The spatter thrown clear of a blot: up to three specks at seeded
// bearings, a radius or so past the rim, each a tenth to a quarter of the
// blot and never more than a speck, or the heaviest blot throws what
// reads as a blot with no logo. A spill is a pool and what it threw; a
// plate of pools is a chart.
float spatter(vec2 q, float r, float s){
  float d = 1e5;
  for (int k = 0; k < 3; k++) {
    float sk = s*(1.9 + float(k)*1.3) + float(k);
    if (fract(sk*.37) < .3 + .15*float(k)) continue;
    float a = fract(sk*.61)*6.2832;
    vec2 c = vec2(cos(a), sin(a)) * r*(1.35 + .9*fract(sk*2.3));
    d = min(d, speck(q - c, min(r*(.07 + .16*fract(sk*4.1)), 6.), sk));
  }
  return d;
}
// A tail thrown off a blot: a thin thread of near-even width, bent a
// little to one side, from inside the blot to well past the rim, thinning
// to nothing. A wedge rooted in the body is a speech bubble's. Whether a
// blot has one, and its bearing, length and bend, are hashed apart, or
// every tail points the same way.
float tail(vec2 q, float r, float s){
  float a = draw(s, 1)*6.2832;
  vec2 dir = vec2(cos(a), sin(a));
  vec2 side = vec2(-dir.y, dir.x);
  float len = r*(1.4 + .6*draw(s, 2));
  float along = clamp(dot(q, dir)/len, 0., 1.);
  vec2 on = dir*along*len + side*(draw(s, 3) - .5)*.5*len*sin(along*3.1416);
  return length(q - on) - r*.12*(1. - along*along);
}
// The ink that ran out of the well: a tongue from its mouth to the
// heaviest blot, narrow at the mouth and broadening into the pool, with
// a wobble along its edge, so the spill has a source.
float run(vec2 p, vec2 a, vec2 b){
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab)/dot(ab, ab), 0., 1.);
  float l = length(p - (a + ab*t));
  // Past the run's reach the plain distance is enough for the merge.
  if (l > 16.) return l - 9.;
  float w = 3.5 + 5.*t + 1.4*(fbm(p*.12) - .5) + .8*sin(t*9. + 1.)*(1. - t);
  return l - w*u_poured;
}
// Coverage of a distance: a crisp edge. No feather, halo or ghost outside
// it: each was tried and each read as a shadow, and the chart has none.
float cover(float d){ return 1. - smoothstep(-.7, .8, d); }

void main(){
  vec2 p = gl_FragCoord.xy / u_scale;
  p.y = u_view.y - p.y;
  p += u_off;
  float d = 1e5, dh = 1e5;
  for (int i = 0; i < ${n}; i++) {
    vec4 b = u_blot[i];
    float r = b.z + u_swell[i];
    if (r < .5) continue;
    vec2 q = p - b.xy;
    float d0 = length(q) - r;
    // Past its spatter this blot cannot reach: the plain distance is
    // enough for the merge, and the noise is the cost of this shader.
    if (d0 > b.z*1.6 + 14.) { d = min(d, d0); continue; }
    float di = blot(q, r, b.z, b.w);
    // The spatter lies where the blot was spilled, at its resting size,
    // and an open pool swallows what it reaches.
    di = smin(di, spatter(q, b.z, b.w), 3.);
    if (i == u_hover) {
      float dp = length(p - u_ptr);
      // Slow waves from the pointer through thick ink, long and low and
      // dying off with distance, and the meniscus: a bulge toward it.
      di += u_hoverT * 1.4 * sin(dp*.16 - u_time*2.4) * exp(-dp/70.);
      di -= u_hoverT * 1.6 * exp(-dp/18.);
      dh = di;
      continue;
    }
    if (b.z < 26. && draw(b.w, 0) < .2) di = smin(di, tail(q, r, b.w), 4.);
    d = smin(d, di, 4.);
  }
  if (u_poured > 0.) d = smin(d, run(p, u_run.xy, u_run.zw), 6.);
  // The open blot merges with whatever it meets more readily than the rest
  // do with each other, so a shoved neighbour pulls away with a neck.
  d = smin(d, dh, 9.);
  // Wet ink: a thin bank at the rim where it dried darkest, a hair lighter
  // in the body. One ink for every blot: a heavy blot printed a shade
  // deeper read as a second layer, and the size carries the weight. No
  // sheen: lit ink is a pebble.
  float dens = .9 + .1*smoothstep(-4., -.5, d);
  float c = cover(d);
  gl_FragColor = vec4(mix(u_paper, u_ink, dens) * c, c);
}`;

// A CSS colour as the shader wants it: "#rrggbb" or "rgb(r, g, b)".
const rgb = (s: string): [number, number, number] => {
  const v = s.trim();
  if (v.startsWith('#')) return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255) as [number, number, number];
  const m = v.match(/[\d.]+/g);
  if (!m || m.length < 3) throw new Error(`the ink plate cannot read the colour ${s}`);
  return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
// The landing: out with a small overshoot, the way a drop settles.
const settle = (k: number) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);

function program(gl: WebGLRenderingContext, n: number) {
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader failed');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, frag(n)));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link failed');
  gl.useProgram(prog);
  // One triangle over the whole canvas.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const at = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(at);
  gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  return prog;
}

export function mount(plate: HTMLElement) {
  const field = plate.querySelector<HTMLElement>('.ink__field')!;
  const canvas = plate.querySelector<HTMLCanvasElement>('.ink__canvas')!;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tall = matchMedia(TALL_AT);
  const blots: Blot[] = [...plate.querySelectorAll<HTMLElement>('.blot')].map((el) => {
    const v = (p: string) => Number(el.style.getPropertyValue(p));
    const x = v('--x');
    const y = v('--y');
    return { el, wide: [x, y], tall: [v('--xp'), v('--yp')], x, y, r: v('--r'), open: Number(el.dataset.open), seed: Number(el.dataset.seed), t: Number(el.dataset.t), px: x, py: y, tx: x, ty: y, vx: 0, vy: 0, swell: 0, land: 0 };
  });
  const n = blots.length;

  // Clear where there is no ink: the page's paper is the plate's.
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: true });
  const U: Record<string, WebGLUniformLocation | null> = {};
  if (gl) {
    const prog = program(gl, n);
    for (const k of ['scale', 'time', 'hoverT', 'poured', 'ptr', 'view', 'off', 'run', 'hover', 'blot', 'swell', 'paper', 'ink']) U[k] = gl.getUniformLocation(prog, `u_${k}`);
    const style = getComputedStyle(plate);
    gl.uniform3fv(U.paper, rgb(style.getPropertyValue('--color-surface')));
    gl.uniform3fv(U.ink, rgb(style.getPropertyValue('--color-text')));
  } else {
    plate.classList.add('is-flat');
  }
  const pos = new Float32Array(n * 4);
  const swell = new Float32Array(n);

  // The field's size in the blots' units, and a unit in pixels.
  let size: [number, number] = [WIDE.w, WIDE.h];
  let u = 1;
  // The well's mouth on either plate, where the run of ink starts.
  const mouthOf = (s: string | undefined) => (s ?? '0 0').split(' ').map(Number) as [number, number];
  const mouths = { wide: mouthOf(plate.dataset.mouth), tall: mouthOf(plate.dataset.mouthTall) };
  let mouth = mouths.wide;
  // Where the pointer is, in units, and whether it is over the field.
  let ptr: [number, number] = [0, 0];
  let ptrIn = false;
  // The blot under the pointer, the one held by a tap, the one with
  // keyboard focus, the one the bloom opens, and the one that is open:
  // held first, else under the pointer, else focused, else the bloom.
  let over = -1;
  let held = -1;
  let focused = -1;
  let bloom = -1;
  let hover = -1;
  let hoverT = 0;
  let landAt = -1;
  const t0 = performance.now();
  let last = t0;

  let raf = 0;
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const w = field.clientWidth;
    if (!w) return;
    // A unit is the column's width over the plate's, on whichever plate
    // the width calls for.
    const on = tall.matches ? TALL : WIDE;
    size = [on.w, on.h];
    u = w / on.w;
    mouth = tall.matches ? mouths.tall : mouths.wide;
    for (const b of blots) {
      [b.x, b.y] = tall.matches ? b.tall : b.wide;
      b.px = b.tx = b.x;
      b.py = b.ty = b.y;
      b.vx = b.vy = 0;
    }
    if (gl) {
      // The canvas bleeds past the field: it is drawn in field units from
      // its own corner, offset by where the field's corner lies in it.
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const cr = canvas.getBoundingClientRect();
      const fr = field.getBoundingClientRect();
      canvas.width = Math.round(cr.width * dpr);
      canvas.height = Math.round(cr.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(U.scale, u * dpr);
      gl.uniform2f(U.view, cr.width / u, cr.height / u);
      gl.uniform2f(U.off, (cr.left - fr.left) / u, (cr.top - fr.top) / u);
    }
    wake();
  };

  const draw = (t: number) => {
    if (!gl) return;
    for (const [i, b] of blots.entries()) {
      pos.set([b.px, b.py, b.r * b.land, b.seed], i * 4);
      swell[i] = b.swell;
    }
    // The waves run from the pointer, or from the middle of the open blot
    // when no pointer is over the field: the bloom, a tap, the keyboard.
    const at = ptrIn || hover < 0 ? ptr : [blots[hover].px, blots[hover].py];
    // The run follows the heaviest blot, which is the first, as it lands
    // and as it is shoved.
    const pool = blots[0];
    gl.uniform4f(U.run, mouth[0], mouth[1], pool?.px ?? 0, pool?.py ?? 0);
    gl.uniform1f(U.poured, pool ? clamp(pool.land, 0, 1) : 0);
    gl.uniform1f(U.time, t);
    gl.uniform1f(U.hoverT, hoverT);
    gl.uniform2f(U.ptr, at[0], at[1]);
    gl.uniform1i(U.hover, hover);
    gl.uniform4fv(U.blot, pos);
    gl.uniform1fv(U.swell, swell);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  function frame(now: number) {
    raf = 0;
    const t = (now - t0) / 1000;
    // A frame's worth of time, capped so a tab coming back does not leap.
    const dt = still ? 1 : clamp((now - last) / 1000, 0, 0.05);
    last = now;
    const ease = (rate: number) => (still ? 1 : 1 - Math.exp(-rate * dt));
    const want = hover >= 0 ? 1 : 0;
    hoverT += (want - hoverT) * ease(WAKE);
    // The waves run as long as a blot is open; everything else settles.
    let busy = hover >= 0 && !still;
    if (Math.abs(want - hoverT) > 0.002) busy = true;
    for (const [i, b] of blots.entries()) {
      if (landAt >= 0 && b.land < 1) {
        const k = still ? 1 : clamp((now - landAt) / 1000 / LAND - b.t, 0, 1);
        b.land = settle(k);
        if (k < 1) busy = true;
      }
      const sw = (i === hover ? b.open : b.r) - b.r;
      b.swell += (sw - b.swell) * ease(SWELL);
      if (Math.abs(sw - b.swell) < 0.05) b.swell = sw;
      else busy = true;
      // Where it should be: home, unless it is open and would run off the
      // plate.
      b.tx = b.x;
      b.ty = b.y;
      if (i === hover) {
        const m = b.r + b.swell + EDGE;
        b.tx = clamp(b.x, m, size[0] - m);
        b.ty = clamp(b.y, m, size[1] - m);
      }
    }
    // The shove, worked out on where the blots should be, not where they
    // are, so no constraint fights the springs: any two whose fields
    // overlap part along the line between them, the open one holding its
    // ground, and a shoved blot passes the shove on. Nothing is shoved
    // off the plate: what a blot pinned at the edge cannot take, the
    // other takes, so an open blot at the edge moves in to make room.
    // Then every blot springs toward its own place.
    const move = (b: Blot, dx: number, dy: number): [number, number] => {
      const m = b.r + b.swell + EDGE;
      const nx = clamp(b.tx + dx, m, size[0] - m);
      const ny = clamp(b.ty + dy, m, size[1] - m);
      const short: [number, number] = [dx - (nx - b.tx), dy - (ny - b.ty)];
      b.tx = nx;
      b.ty = ny;
      return short;
    };
    for (let pass = 0; pass < 6; pass++) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = blots[i];
          const b = blots[j];
          const dx = b.tx - a.tx;
          const dy = b.ty - a.ty;
          const dist = Math.hypot(dx, dy) || 1;
          const open = i === hover || j === hover;
          const need = a.r + a.swell + b.r + b.swell + (open ? (a.r + a.swell + b.r + b.swell) * WARP + GAP : GAP * 0.6);
          if (dist >= need) continue;
          const push = need - dist;
          const wa = i === hover ? 0 : j === hover ? 1 : 0.5;
          const [ax, ay] = move(a, (-dx / dist) * push * wa, (-dy / dist) * push * wa);
          const [bx, by] = move(b, (dx / dist) * push * (1 - wa) - ax, (dy / dist) * push * (1 - wa) - ay);
          if (bx || by) move(a, -bx, -by);
        }
      }
    }
    for (const b of blots) {
      if (still) {
        b.px = b.tx;
        b.py = b.ty;
      } else {
        b.vx += (b.tx - b.px) * PULL * dt;
        b.vy += (b.ty - b.py) * PULL * dt;
        b.vx *= Math.exp(-DAMP * dt);
        b.vy *= Math.exp(-DAMP * dt);
        b.px += b.vx * dt;
        b.py += b.vy * dt;
      }
    }
    draw(t);
    for (const [i, b] of blots.entries()) {
      const s = b.el.style;
      const was = s.getPropertyValue('--px');
      s.setProperty('--px', b.px.toFixed(1));
      s.setProperty('--py', b.py.toFixed(1));
      s.setProperty('--R', (b.r + b.swell).toFixed(1));
      if (Math.abs(Number(was) - b.px) > 0.05 || Math.abs(b.vx) + Math.abs(b.vy) > 0.5) busy = true;
      b.el.classList.toggle('is-down', b.land > 0.5);
      b.el.classList.toggle('is-hot', i === hover);
      b.el.classList.toggle('is-open', i === hover && b.swell > (b.open - b.r) * 0.6);
    }
    if (busy) wake();
  }

  const set = () => {
    const next = held >= 0 ? held : over >= 0 ? over : focused >= 0 ? focused : bloom;
    if (next !== hover) {
      hover = next;
      wake();
    }
  };
  // The blot under a point, by the ink as drawn: the open one if the
  // point is on it, since it prints over the rest, else the one the point
  // lies deepest in. Tested against where the blots are now, not against
  // the buttons, so a blot that slides out from under a still pointer as
  // it is shoved is not still hovered.
  const hit = (x: number, y: number) => {
    const depth = (b: Blot) => Math.hypot(x - b.px, y - b.py) - (b.r + b.swell) - 2;
    if (hover >= 0 && depth(blots[hover]) < 0) return hover;
    let best = -1;
    let deepest = 0;
    for (const [i, b] of blots.entries()) {
      const dd = depth(b);
      if (dd < deepest) {
        best = i;
        deepest = dd;
      }
    }
    return best;
  };
  const point = (e: PointerEvent) => {
    const box = field.getBoundingClientRect();
    ptr = [(e.clientX - box.left) / u, (e.clientY - box.top) / u];
  };
  field.addEventListener('pointermove', (e) => {
    point(e);
    if (e.pointerType === 'touch') return;
    ptrIn = true;
    over = hit(ptr[0], ptr[1]);
    set();
  });
  field.addEventListener('pointerleave', () => {
    ptrIn = false;
    over = -1;
    set();
  });
  // A tap holds a blot open, since a touch cannot hover, and a second tap
  // or one on the paper lets go. A click does neither: the pointer that
  // clicked is still over the blot, and moving off is how it closes.
  field.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'touch') return;
    point(e);
    const i = hit(ptr[0], ptr[1]);
    held = held === i ? -1 : i;
    set();
  });
  for (const [i, b] of blots.entries()) {
    b.el.addEventListener('focus', () => {
      if (!b.el.matches(':focus-visible')) return;
      focused = i;
      set();
    });
    b.el.addEventListener('blur', () => {
      if (focused === i) focused = -1;
      set();
    });
  }

  new ResizeObserver(resize).observe(field);
  tall.addEventListener('change', resize);
  resize();
  // The landing, once, when a quarter of the plate is in frame.
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      landAt = performance.now();
      wake();
      io.disconnect();
      // The bloom, unless the pointer got there first or motion is off.
      if (still || n === 0) return;
      setTimeout(() => {
        if (over >= 0 || held >= 0) return;
        bloom = 0;
        set();
        setTimeout(() => {
          bloom = -1;
          set();
        }, BLOOM_FOR);
      }, BLOOM_AT);
    },
    { threshold: IN_FRAME },
  );
  io.observe(plate);
  wake();
}
