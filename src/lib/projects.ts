import type { CollectionEntry } from 'astro:content';
import type { Weighed } from './drops';
import type { Org } from './orgs';

type Project = CollectionEntry<'projects'>;

// The order is hand-set, not derived: the sheet a recruiter should read
// first is rarely the one that finished last. Lower rank prints first, and
// the home page shows rank 1.
export const byRank = (a: Project, b: Project) => a.data.rank - b.data.rank;

export type Series = { org: Org; sheets: Project[] };

// Sheets in series, one per publisher, each in rank order. A series prints
// where its first sheet would have: a Map keeps insertion order, and the
// sheets go in by rank, so the series holding rank 1 comes first.
export function series(projects: Project[]): Series[] {
  const by = new Map<Org, Project[]>();
  for (const p of [...projects].sort(byRank)) {
    const sheets = by.get(p.data.org) ?? [];
    sheets.push(p);
    by.set(p.data.org, sheets);
  }
  return [...by].map(([org, sheets]) => ({ org, sheets }));
}

// How much of the work ran through a stack name, read off the commit history
// when the sheet was drawn: `core` is where most of the changed lines went,
// `touched` what was wired up and left alone, `used` the rest. The label is
// what the key and the phone list print.
export type Tier = 'core' | 'used' | 'touched';
export const TIERS: [Tier, string][] = [
  ['core', 'most of it'],
  ['used', 'part of it'],
  ['touched', 'in passing'],
];

// Which tier a name holds on a sheet.
export const tierOf = (p: Project['data'], name: string): Tier =>
  p.core.includes(name) ? 'core' : p.touched.includes(name) ? 'touched' : 'used';

// What a tier weighs on the ink plate: a core name counts one sheet, one in
// the middle half, one touched in passing a quarter.
const WEIGHT: Record<Tier, number> = { core: 1, used: 0.5, touched: 0.25 };

// The plate prints a stack from one sheet's weight up: a lighter blot has no
// room for its logo, and a plate of what was touched in passing is not what
// the top of the page is for.
const PRINTED = 1;

// Every stack name across the sheets with a sheet's weight of use or more,
// with the domains it was used in, and the domains in order of how much ink
// went into each, which is the order they anchor the plate.
export function ink(projects: Project[]): { names: Weighed[]; domains: string[] } {
  const names = new Map<string, Weighed>();
  const domains = new Map<string, number>();
  for (const { data: p } of projects) {
    for (const name of p.stack) {
      const w = WEIGHT[tierOf(p, name)];
      const entry = names.get(name) ?? { name, weight: 0, domains: [] };
      entry.weight += w;
      if (!entry.domains.includes(p.domain)) entry.domains.push(p.domain);
      names.set(name, entry);
      domains.set(p.domain, (domains.get(p.domain) ?? 0) + w);
    }
  }
  const order = [...domains].sort((a, b) => b[1] - a[1]).map(([d]) => d);
  for (const entry of names.values()) entry.domains.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return { names: [...names.values()].filter((n) => n.weight >= PRINTED), domains: order };
}
