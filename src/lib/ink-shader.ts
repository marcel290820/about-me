// The ink on the paper, in the browser. A fragment shader draws every blot
// as a distance field: a drop longer one way than the other, lopsided by
// seeded harmonics, with a lobe or two where it splashed on some, a crust
// of noise round the rim, a thread of a tail off a few small ones and a
// few specks of spatter thrown clear of most, merged softly with its
// neighbours so two that come close join with a neck, a crisp edge and a
// thin dark bank where it dried. The spill has a source and a direction:
// every drop lies long along its bearing from the pool the well poured,
// with its tail and most of its spatter on the far side, the farther it
// flew the longer, and a trail of specks runs on past the pool along the
// line the ink came in on; the ink ran from the well's mouth into the
// pool, the quill's nib skidded through the pool to where it lies, and
// the ink has dried from the edges in, so a far drop has a paler body
// under its dark rim and the pool is wet to the middle. Nothing outside
// the edge: a feather, a halo, a sheen and a print ghost were each tried
// and each read as a shadow, and the chart has none. The canvas is clear
// where there is no ink and bleeds past the field, so the page's own
// paper shows through and nothing is cut straight: the spill has no
// edge. The hovered blot opens: its radius springs out to what the plate
// drew it to open to, its neighbours are shoved clear on a spring of
// their own and pass the shove on, the well and the quill stand where
// they are and the blots go round them, it merges with its neighbours
// more readily than they do with each other so they pull apart with a
// neck, and slow waves run through it from the pointer. The logos and
// the domain words are HTML over the canvas, moved through --px, --py
// and --R, so this file owns motion and the CSS owns everything the
// words look like.
//
// Contract: mount(plate) reads every .blot's --x, --y (the wide plate),
// --xp, --yp (the tall one, below `sm`), --r, data-open (absent on a
// droplet, which never opens and is never hit), data-seed and data-lag,
// and the plate's data-mouth and data-nib (with their -tall pairs), and
// takes over from there. The first .blot in the document is the pool. It
// draws nothing until a quarter of the plate is in frame, then lands the
// blots out from the pool. Without
// WebGL it sets `is-flat` on the plate and still runs the springs, so
// the discs the CSS prints instead open the same way. Under reduced
// motion every spring jumps to its target and the waves stop. Nothing
// here throws after mount: a lost context leaves the last frame.
import { TALL, WIDE, type Capsule } from './drops';

// Paper kept round an open blot: from the plate's edge, from a shoved
// neighbour (a cap height and more, plus a share of both radii for the
// rims' warp and lobes, so the pool gets a clean field for its words and
// stands clear of what it shoved: closer, the two merged and no one
// could tell which had opened), and from a mark, just enough that the
// bottle's outline is off the ink, since every unit of that slides the
// open pool away from the pointer. At rest a blot keeps a little less
// from a mark than the layout gave it, so the shove never moves a blot
// that has not been shoved.
const EDGE = 8;
const GAP = 22;
const MARK = 6;
const REST = 5;
const WARP = 0.15;
// Paper kept between two blots neither of which is open: the layout's
// own least gap, so a blot at rest is never shoved by its neighbours,
// and two shoved together may join, the way pooled ink does.
const REST_PAIR = 6;
// Rounds of the shove a frame: a shove passes down a chain of blots one
// round at a time, and with six a blot at the end of a chain blocked by
// a mark was left half shoved and merged into the open one.
const PASSES = 20;
// How long a blot takes to land, the plate's share in frame that starts
// it, how far behind the pool the farthest blot lands (in landings, as
// the spill spreads out from its source), and the bloom: once the last
// blot is down the heaviest opens by itself, holds once it is open, and
// closes again, which is how a pointer learns what the plate does
// without being told. The hold is counted from when the pool is open,
// not from when it began to, so a slow device still shows it.
const LAND = 0.6;
const IN_FRAME = 0.25;
const SPREAD = 0.9;
// How long the ink takes to run from the mouth to where the pool lands,
// before anything lands: the accident, not the aftermath.
const POUR = 0.5;
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
  // What it opens to on hover; a droplet has nothing to open and stays
  // at its radius.
  open: number;
  droplet: boolean;
  seed: number;
  lag: number;
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
uniform float u_scale, u_time, u_hoverT, u_poured, u_landed;
uniform vec2 u_ptr, u_view, u_off, u_nib;
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
// A blot's edge, at radius r, spilled at radius r0, lying along the axis
// (a bearing on the plate) and having flown far (0 at the pool, 1 well
// away). The drop is longer along its axis than across by a seeded
// share, and by more the farther it flew, since a drop that lands at a
// run lands long; the stretch keeps the area, narrowing the drop as it
// lengthens, so a drop lies within the paper the layout gave it and a
// row of them does not merge into a chain. Lopsided by four harmonics
// whose weights are seeded too, so no two blots are the same species: a
// little stronger on a small blot, which is a drop and smooth but never
// round, faint on a big one, and never so strong that a drop is a pick
// with its point wherever the seed put it, since the stretch is what
// says which way it flew. Some have a lobe or two where the ink
// splashed, broad and low, on the far side from the pool where a flying
// drop's edge breaks, all round on the pool itself: a sharp one is a
// speech bubble's tail. The crust is noise: lobes round the rim, as
// many per unit of rim on a pool as on a drop, sampled on a circle so
// the rim closes without a seam, and a broader lean over the area,
// which the big blots carry and the small ones barely. The warp grows
// at two thirds the rate the pool does as it opens: a pool that has
// spread is smoother than the drop it was, and the words need the clean
// field, but a pool with a flat rim is a disc.
float blot(vec2 q, float r, float r0, float s, float axis, float far, float pool){
  float h1 = draw(s, 0), h2 = draw(s, 1), h3 = draw(s, 2), h4 = draw(s, 3);
  q = turn(axis) * q;
  // The stretch is the spilled drop's, in units, not a share of the pool:
  // from round to nearly twice as long as wide, most of them nearer round,
  // so some read as runs and some as drops; the pool itself only a little,
  // or its ring of words would not fit it.
  float st = sqrt(1. + (mix(.9*h3*h3, .15*h3, pool) + .5*far)*r0/r);
  q.x /= st;
  q.y *= st;
  float l = max(length(q), 1e-3);
  vec2 c = q / l;
  // The same guard at the blot's own middle, or the pixel under it is NaN.
  float a = length(q) > 1e-3 ? atan(q.y, q.x) : 0.;
  // The harmonics are the drop's own and stay with it as it opens, so a
  // small blot open is still the lopsided drop it was, only larger; the
  // crust is a pool's at the size it is now, so a small blot opened takes
  // a pool's crust. With both scaled down as it opened it opened into a
  // disc, and the one interactive moment was the moment the ink turned
  // into a button.
  float small0 = 1. - smoothstep(14., 40., r0);
  float small = 1. - smoothstep(14., 40., r);
  float body = (.03 + .07*small0*h1)*cos(2.*a - s*3.1) + (.02 + .04*small0)*cos(3.*a - s*5.3)
             + (.02 + .04*h2)*cos(4.*a + s*7.7) + .03*h3*cos(5.*a - s*2.2);
  // The lobes are the rim's real events, two or three at most, with long
  // smooth arc between them; the crust under them is slow, a few broad
  // swells round the rim and no more, since a rim of small even lobes all
  // the way round read as crenellation and not as wet ink.
  float lobe = 0.;
  if (h3 > .3) {
    float a0 = mix((h2 - .5)*1.6, h2*6.2832, pool);
    lobe += (.10 + .18*h1) * pow(max(cos(a - a0), 0.), 6. + 10.*h2);
    if (h1 > .5) lobe += (.06 + .12*h3) * pow(max(cos(a - a0 - 2.1 - 1.5*h4), 0.), 9.);
    if (h4 > .6) lobe += (.05 + .08*h2) * pow(max(cos(a - a0 + 1.4 + 1.2*h1), 0.), 14.);
  }
  float w1 = fbm(c*(.45 + r/90.) + s*5.) - .5;
  float w2 = fbm(q*.05 + s*9.) - .5;
  float crust = (.08 + .16*(1.-small))*w1 + (.06 + .10*(1.-small))*w2;
  return l - r - (r0 + .65*(r - r0))*(body + lobe + crust);
}
// A speck of spatter: a small drop, lopsided, no noise, which at its size
// no one would see.
float speck(vec2 q, float r, float s){
  float l = max(length(q), 1e-3);
  float a = length(q) > 1e-3 ? atan(q.y, q.x) : 0.;
  return l - r*(1. + .12*cos(2.*a - s*3.) + .08*cos(3.*a + s*5.));
}
// The spatter thrown clear of a blot: up to three specks at seeded
// bearings within a fan about the axis (the whole circle for the pool,
// the far side for a drop, since what a landing drop throws goes on the
// way it was going), a radius or so past the rim, each a tenth to a
// quarter of the blot and never more than a speck, or the heaviest blot
// throws what reads as a blot with no logo. Fewer and smaller the more
// the blot lies behind the mouth (ahead: 1 straight ahead of it, 0
// straight behind), since the throw went ahead of the bottle and a
// plate spattered evenly all round is a scatter. A spill is a pool and
// what it threw; a plate of pools is a chart.
float spatter(vec2 q, float r, float s, float axis, float fan, float ahead){
  float d = 1e5;
  for (int k = 0; k < 3; k++) {
    float sk = s*(1.9 + float(k)*1.3) + float(k);
    if (fract(sk*.37) < .3 + .15*float(k) + .45*(1. - ahead)) continue;
    float a = axis + (fract(sk*.61) - .5)*fan;
    vec2 c = vec2(cos(a), sin(a)) * r*(1.35 + .9*fract(sk*2.3));
    d = min(d, speck(q - c, min(r*(.07 + .16*fract(sk*4.1)), 6.)*(.7 + .6*ahead), sk));
  }
  return d;
}
// A tail off a drop: a thin thread of near-even width, bent a little to
// one side, from inside the drop to well past the rim, thinning to
// nothing, back toward the pool, the way a comet's says where it came
// from (a forensic tail points the other way, and nobody read it). A
// wedge rooted in the body is a speech bubble's. Whether a drop has one,
// and its length and bend, are hashed apart.
float tail(vec2 q, float r, float s, float axis){
  float a = axis + 3.1416 + (draw(s, 1) - .5)*.7;
  vec2 dir = vec2(cos(a), sin(a));
  vec2 side = vec2(-dir.y, dir.x);
  float len = r*(1.4 + .6*draw(s, 2));
  float along = clamp(dot(q, dir)/len, 0., 1.);
  vec2 on = dir*along*len + side*(draw(s, 3) - .5)*.5*len*sin(along*3.1416);
  return length(q - on) - r*.12*(1. - along*along);
}
// The ink that ran out of the well: a tongue from its mouth to the
// pool, narrow at the mouth and broadening into the pool, with a wobble
// along its edge, so the spill has a source. It is poured first: the
// tongue reaches u_poured of the way from the mouth, and the pool lands
// where it arrives, so the accident happens once rather than being
// drawn already over.
float run(vec2 p, vec2 a, vec2 b){
  vec2 ab = (b - a)*u_poured;
  float t = clamp(dot(p - a, ab)/max(dot(ab, ab), 1.), 0., 1.);
  vec2 on = a + ab*t;
  float l = length(p - on);
  // Past the run's reach the plain distance is enough for the merge.
  if (l > 18.) return l - 11.;
  // Necked where it leaves the mouth, swelling where it lands, and the
  // two edges with profiles of their own: parallel sides were a ruled
  // bar, the one ruled shape on a plate that must not have one.
  vec2 dir = normalize(b - a);
  float side = sign(dot(p - on, vec2(-dir.y, dir.x)));
  float w = 2.2 + 6.*t*t*u_poured;
  w *= 1. - .35*exp(-pow((t - .12)/.09, 2.));
  w += side > 0. ? 1.1*sin(t*6.3 + 1.) : .9*sin(t*9.7 + 2.5);
  w += 1.2*(fbm(p*.12) - .5);
  return l - w;
}
// What the pour threw on past the pool: a trail of specks along the
// line the ink came in on, each smaller and farther from the last, and
// wandering off the line a little, so the spill has a direction and not
// only a source.
float trail(vec2 p, vec2 pool, vec2 axis, float R){
  vec2 side = vec2(-axis.y, axis.x);
  float d = 1e5;
  vec2 far = pool;
  for (int k = 0; k < 6; k++) {
    float fk = float(k);
    float h = fract((fk + 1.)*.7548766);
    float g = fract((fk + 1.)*.5698403);
    vec2 c = pool + axis*(R + 10. + 18.*fk + 4.*fk*fk) + side*(h - .5)*(12. + 8.*fk);
    d = min(d, speck(p - c, (4.2 - .55*fk)*(.8 + .4*g), fk*3.7));
    if (k == 3) far = c;
  }
  // And one thread from the pool's rim out to the fourth speck, thin
  // and wandering: the one line that says the ink flew.
  vec2 a = pool + axis*(R - 4.);
  vec2 ab = far - a;
  float t = clamp(dot(p - a, ab)/dot(ab, ab), 0., 1.);
  vec2 on = a + ab*t + side*6.*sin(t*3.1416)*sin(t*7.);
  float w = .9*(1. - .6*t) + .3*(noise(p*.4) - .5);
  return min(d, length(p - on) - w);
}
// The skid the quill's nib made through the wet ink as it fell: out of
// the pool at its rim toward where the nib lies, as wide as a nib where
// it left the ink and thinning to nothing, bent the way a skid is, with
// a dry skip partway where the nib bounced and a last comma of ink short
// of the nib, so the quill reads as lifted out of the ink and not wired
// to it. A line of one width from pool to nib was a cable.
float skid(vec2 p, vec2 nib, vec2 pool, float R){
  vec2 dir = normalize(nib - pool);
  vec2 a = pool + dir*(R - 6.);
  vec2 ab = nib - a;
  float t = clamp(dot(p - a, ab)/dot(ab, ab), 0., 1.);
  vec2 side = vec2(-dir.y, dir.x);
  vec2 on = a + ab*t + side*4.*sin(t*3.1416);
  float l = length(p - on);
  if (l > 10.) return l - 3.;
  float w = (.4 + 2.6*(1. - t)*(1. - t)) * (1. - smoothstep(.6, .78, t));
  w *= 1. - .95*smoothstep(.34, .4, t)*(1. - smoothstep(.46, .52, t));
  w += .4*(noise(p*.35) - .5);
  float d = l - w*u_landed;
  d = min(d, speck(p - (a + ab*.88 + side*2.), 1.5*u_landed, 3.3));
  // And the ink the nib itself lies in, so it touches the ink and is not
  // only pointed at it.
  return min(d, speck(p - nib, 4.*u_landed, 1.7));
}
// Coverage of a distance: a crisp edge. No feather, halo or ghost outside
// it: each was tried and each read as a shadow, and the chart has none.
float cover(float d){ return 1. - smoothstep(-.7, .8, d); }

void main(){
  vec2 p = gl_FragCoord.xy / u_scale;
  p.y = u_view.y - p.y;
  p += u_off;
  vec2 pool = u_run.zw;
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
    // Its bearing from the pool and how far it flew, and how far ahead
    // of the mouth it lies. The pool itself, the first blot, is turned by
    // its seed and throws all round.
    vec2 rel = b.xy - pool;
    float isPool = i == 0 ? 1. : 0.;
    // A branch, not a mix: atan(0, 0) is undefined, and on a real GPU it
    // is NaN, which a mix with a weight of one carries through, and the
    // pool then printed as a disc out to its cull radius, three times its
    // size. SwiftShader returned zero there and hid it.
    float bearing = i == 0 ? draw(b.w, 3)*6.2832 : atan(rel.y, rel.x);
    float far = (1. - isPool)*smoothstep(40., 300., length(rel));
    float ahead = mix(.5 + .5*dot(normalize(b.xy - u_run.xy), normalize(pool - u_run.xy)), 1., isPool);
    float di = blot(q, r, b.z, b.w, bearing + (1. - isPool)*(draw(b.w, 3) - .5)*.6, far, isPool);
    // The spatter lies where the blot was spilled, at its resting size,
    // and an open pool swallows what it reaches.
    di = smin(di, spatter(q, b.z, b.w, bearing, mix(2.4, 6.2832, isPool), ahead), 3.);
    if (i == u_hover) {
      float dp = length(p - u_ptr);
      // Slow waves from the pointer through thick ink, long and low and
      // dying off with distance, and the meniscus: a bulge toward it.
      di += u_hoverT * 1.4 * sin(dp*.16 - u_time*2.4) * exp(-dp/70.);
      di -= u_hoverT * 1.6 * exp(-dp/18.);
      dh = di;
      continue;
    }
    if (b.z < 26. && draw(b.w, 0) < .35) di = smin(di, tail(q, r, b.w, bearing), 4.);
    d = smin(d, di, 4.);
  }
  if (u_poured > 0.) d = smin(d, run(p, u_run.xy, pool), 6.);
  if (u_landed > 0.) {
    d = smin(d, skid(p, u_nib, pool, u_blot[0].z + u_swell[0]), 3.);
    d = min(d, trail(p, pool, normalize(pool - u_run.xy), u_blot[0].z));
  }
  // The open blot merges with whatever it meets a little more readily than
  // the rest do with each other, so a shoved neighbour pulls away with a
  // neck; much more readily, and the two were one mass.
  d = smin(d, dh, 6.);
  // Wet ink: a thin bank at the rim where it dried darkest, a hair lighter
  // in the body, and lighter still the farther from the pool, since the
  // spill dried from its edges in and a dried drop keeps its ink at the
  // rim. The bank is narrow and its inner edge is sharp, the way a dried
  // ring is: graded in over four units it read as a bevel on a pebble.
  // One ink for every blot: a heavy blot printed a shade deeper read as a
  // second layer, and the size carries the weight. No sheen: lit ink is a
  // pebble.
  float dry = smoothstep(70., 380., length(p - pool));
  float dens = mix(.9 - .14*dry, 1., smoothstep(-2.6, -1.4, d));
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
// A pair of plate coordinates off a data attribute.
const pair = (s: string | undefined) => (s ?? '0 0').split(' ').map(Number) as [number, number];

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
    const r = v('--r');
    const droplet = el.dataset.open === undefined;
    return { el, wide: [x, y], tall: [v('--xp'), v('--yp')], x, y, r, open: droplet ? r : Number(el.dataset.open), droplet, seed: Number(el.dataset.seed), lag: Number(el.dataset.lag), t: 0, px: x, py: y, tx: x, ty: y, vx: 0, vy: 0, swell: 0, land: 0 };
  });
  const n = blots.length;

  // Clear where there is no ink: the page's paper is the plate's.
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: true });
  const U: Record<string, WebGLUniformLocation | null> = {};
  if (gl) {
    const prog = program(gl, n);
    for (const k of ['scale', 'time', 'hoverT', 'poured', 'landed', 'ptr', 'view', 'off', 'nib', 'run', 'hover', 'blot', 'swell', 'paper', 'ink']) U[k] = gl.getUniformLocation(prog, `u_${k}`);
    const style = getComputedStyle(plate);
    gl.uniform3fv(U.paper, rgb(style.getPropertyValue('--color-surface')));
    gl.uniform3fv(U.ink, rgb(style.getPropertyValue('--color-text')));
  } else {
    plate.classList.add('is-flat');
  }
  const pos = new Float32Array(n * 4);
  const swell = new Float32Array(n);

  // The field's size in the blots' units, a unit in pixels, and the paper
  // the marks keep on the plate in use.
  let size: [number, number] = [WIDE.w, WIDE.h];
  let u = 1;
  let keep: Capsule[] = WIDE.keep;
  // The well's mouth and the quill's nib on either plate: where the run
  // of ink starts and where the skid ends.
  const mouths = { wide: pair(plate.dataset.mouth), tall: pair(plate.dataset.mouthTall) };
  const nibs = { wide: pair(plate.dataset.nib), tall: pair(plate.dataset.nibTall) };
  let mouth = mouths.wide;
  let nib = nibs.wide;
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
  let bloomOpenAt = -1;
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
    keep = on.keep;
    u = w / on.w;
    mouth = tall.matches ? mouths.tall : mouths.wide;
    nib = tall.matches ? nibs.tall : nibs.wide;
    const diag = Math.hypot(on.w, on.h);
    for (const b of blots) {
      [b.x, b.y] = tall.matches ? b.tall : b.wide;
      b.px = b.tx = b.x;
      b.py = b.ty = b.y;
      b.vx = b.vy = 0;
      // The pool lands first and the rest follow out from it, each a
      // little behind or ahead of its distance, so the spill spreads.
      b.t = (SPREAD * Math.hypot(b.x - blots[0].x, b.y - blots[0].y)) / diag + b.lag;
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
      gl.uniform2f(U.nib, nib[0], nib[1]);
    }
    wake();
  };

  const draw = (t: number, poured: number) => {
    if (!gl) return;
    for (const [i, b] of blots.entries()) {
      pos.set([b.px, b.py, b.r * b.land, b.seed], i * 4);
      swell[i] = b.swell;
    }
    // The waves run from the pointer, or from the middle of the open blot
    // when no pointer is over the field: the bloom, a tap, the keyboard.
    const at = ptrIn || hover < 0 ? ptr : [blots[hover].px, blots[hover].py];
    // The run and the skid follow the pool, which is the first blot, as
    // it lands and as it is shoved: the run is poured before it lands,
    // the skid and the trail come with it.
    const pool = blots[0];
    gl.uniform4f(U.run, mouth[0], mouth[1], pool?.px ?? 0, pool?.py ?? 0);
    gl.uniform1f(U.poured, poured);
    gl.uniform1f(U.landed, pool ? clamp(pool.land, 0, 1) : 0);
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
    // The pour runs first, and the blots land once it has reached the
    // pool.
    const since = landAt < 0 ? -1 : (now - landAt) / 1000;
    const poured = since < 0 ? 0 : still ? 1 : clamp(since / POUR, 0, 1);
    if (poured > 0 && poured < 1) busy = true;
    for (const [i, b] of blots.entries()) {
      if (since >= 0 && b.land < 1) {
        const k = still ? 1 : clamp((since - POUR) / LAND - b.t, 0, 1);
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
    // The well and the quill do not move: a blot shoved onto one, or a
    // pool opening over one, is moved off it. Then every blot springs
    // toward its own place.
    const move = (b: Blot, dx: number, dy: number): [number, number] => {
      const m = b.r + b.swell + EDGE;
      const nx = clamp(b.tx + dx, m, size[0] - m);
      const ny = clamp(b.ty + dy, m, size[1] - m);
      const short: [number, number] = [dx - (nx - b.tx), dy - (ny - b.ty)];
      b.tx = nx;
      b.ty = ny;
      return short;
    };
    for (let pass = 0; pass < PASSES; pass++) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = blots[i];
          const b = blots[j];
          const dx = b.tx - a.tx;
          const dy = b.ty - a.ty;
          const dist = Math.hypot(dx, dy) || 1;
          const open = i === hover || j === hover;
          const need = a.r + a.swell + b.r + b.swell + (open ? (a.r + a.swell + b.r + b.swell) * WARP + GAP : REST_PAIR);
          if (dist >= need) continue;
          const push = need - dist;
          const wa = i === hover ? 0 : j === hover ? 1 : 0.5;
          const [ax, ay] = move(a, (-dx / dist) * push * wa, (-dy / dist) * push * wa);
          const [bx, by] = move(b, (dx / dist) * push * (1 - wa) - ax, (dy / dist) * push * (1 - wa) - ay);
          if (bx || by) move(a, -bx, -by);
        }
      }
      for (const [i, b] of blots.entries()) {
        for (const c of keep) {
          const dx = c.b[0] - c.a[0];
          const dy = c.b[1] - c.a[1];
          const k = clamp(((b.tx - c.a[0]) * dx + (b.ty - c.a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
          const ex = b.tx - c.a[0] - dx * k;
          const ey = b.ty - c.a[1] - dy * k;
          const dist = Math.hypot(ex, ey) || 1;
          const need = b.r + b.swell + c.r + (i === hover ? MARK : REST);
          if (dist < need) move(b, (ex / dist) * (need - dist), (ey / dist) * (need - dist));
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
    draw(t, poured);
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
    // The bloom holds for a while once the pool is open, then lets go.
    if (bloom >= 0 && hover === bloom) {
      const b = blots[bloom];
      if (bloomOpenAt < 0 && b.swell >= b.open - b.r - 0.5) bloomOpenAt = now;
      if (bloomOpenAt >= 0 && now - bloomOpenAt > BLOOM_FOR) {
        bloom = -1;
        set();
      }
      busy = true;
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
  // lies deepest in; never a droplet, which has nothing to open. Tested
  // against where the blots are now, not against the buttons, so a blot
  // that slides out from under a still pointer as it is shoved is not
  // still hovered.
  const hit = (x: number, y: number) => {
    const depth = (b: Blot) => Math.hypot(x - b.px, y - b.py) - (b.r + b.swell) - 2;
    if (hover >= 0 && depth(blots[hover]) < 0) return hover;
    let best = -1;
    let deepest = 0;
    for (const [i, b] of blots.entries()) {
      if (b.droplet) continue;
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
      }, BLOOM_AT);
    },
    { threshold: IN_FRAME },
  );
  io.observe(plate);
  wake();
}
