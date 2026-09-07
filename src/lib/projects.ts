import type { CollectionEntry } from 'astro:content';
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
