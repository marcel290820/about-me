import type { CollectionEntry } from 'astro:content';

type Project = CollectionEntry<'projects'>;

// The order is hand-set, not derived: the sheet a recruiter should read
// first is rarely the one that finished last. Lower rank prints first, and
// the home page shows rank 1.
export const byRank = (a: Project, b: Project) => a.data.rank - b.data.rank;
