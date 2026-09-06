// Bodies sampled from one spine.
//
// Anything with a curve to it -- a fish, a serpent, a pressure hull -- is built
// here rather than hand-fitted, because both edges and every fin ray then read
// the same numbers and cannot come apart when the curve changes. Hand-fitting
// a silhouette is how the manta that used to swim in the water column kept
// coming out an umbrella.

/** Control points for a girth profile: [t, half-height]. */
export type Prof = [number, number][];

export interface Node {
  t: number;
  x: number;
  y: number;
  /** Half-height above the spine. */
  u: number;
  /** Half-height below it. */
  d: number;
}

/** Smoothstep between control points, so six numbers still give a fair curve. */
export function at(prof: Prof, t: number): number {
  for (let i = 1; i < prof.length; i++) {
    if (t <= prof[i][0]) {
      const [t0, v0] = prof[i - 1];
      const [t1, v1] = prof[i];
      const k = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * (k * k * (3 - 2 * k));
    }
  }
  return prof[prof.length - 1][1];
}

/** Cubic Hermite through the control points, tangents by finite difference.
 *
 * `at()` is a smoothstep and goes flat at every control point, which rounds a
 * snout into a bulb, puts a wobble in a straight back and a staircase up the
 * front of a sail. Use this wherever a profile has to carry slope through its
 * points; use `at()` where a flat spot at each point is wanted. Past the last
 * point it holds the last value. */
export function fair(prof: Prof, t: number): number {
  const slope = (i: number) => {
    const a = prof[Math.max(0, i - 1)];
    const b = prof[Math.min(prof.length - 1, i + 1)];
    return (b[1] - a[1]) / (b[0] - a[0]);
  };
  for (let i = 1; i < prof.length; i++) {
    if (t <= prof[i][0]) {
      const [t0, v0] = prof[i - 1];
      const [t1, v1] = prof[i];
      const h = t1 - t0;
      const k = (t - t0) / h;
      const k2 = k * k;
      const k3 = k2 * k;
      return (
        (2 * k3 - 3 * k2 + 1) * v0 +
        (k3 - 2 * k2 + k) * h * slope(i - 1) +
        (-2 * k3 + 3 * k2) * v1 +
        (k3 - k2) * h * slope(i)
      );
    }
  }
  return prof[prof.length - 1][1];
}

export interface SpineOpts {
  from: number;
  to: number;
  up: Prof;
  /** Defaults to `up`, which gives a body symmetric about its spine. */
  down?: Prof;
  /** Spine height at t. Flat if omitted. */
  y?: (t: number) => number;
  steps?: number;
}

export function spine({
  from,
  to,
  up,
  down = up,
  y,
  steps = 42,
}: SpineOpts): Node[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return {
      t,
      x: from + (to - from) * t,
      y: y ? y(t) : 0,
      u: at(up, t),
      d: at(down, t),
    };
  });
}

/** Closed outline around a spine. Both edges read the same nodes. */
export function shell(n: Node[]): string {
  const top = n.map((p) => `${p.x.toFixed(1)} ${(p.y - p.u).toFixed(1)}`);
  const bot = n
    .map((p) => `${p.x.toFixed(1)} ${(p.y + p.d).toFixed(1)}`)
    .reverse();
  return `M${top.join('L')}L${bot.join('L')}Z`;
}

/** Open polyline at a lift above the spine's own upper edge. */
export function ridge(n: Node[], lift: (p: Node) => number): string {
  return (
    'M' +
    n
      .map((p) => `${p.x.toFixed(1)} ${(p.y - p.u - lift(p)).toFixed(1)}`)
      .join('L')
  );
}

/** Vertical fin rays from the back up to that ridge. */
export function rays(
  n: Node[],
  lift: (p: Node) => number,
  every: number,
  min = 0,
): string {
  return n
    .filter((p, i) => i % every === 0 && p.t >= min)
    .map(
      (p) =>
        `M${p.x.toFixed(1)} ${(p.y - p.u).toFixed(1)}V${(p.y - p.u - lift(p)).toFixed(1)}`,
    )
    .join('');
}

// --- Hulls ----------------------------------------------------------------
// Three built things share one profile family: a pressure hull is a pressure
// hull whether it is towed, flown or crewed.
export const torpedo = (from: number, to: number, y: number, r: number) =>
  spine({
    from,
    to,
    y: () => y,
    steps: 30,
    up: [
      [0, r * 0.34],
      [0.16, r * 0.9],
      [0.62, r],
      [0.9, r * 0.86],
      [1, r * 0.2],
    ],
  });
