import type { CollectionEntry } from 'astro:content';

type Project = CollectionEntry<'projects'>;

// Newest first: by the year the work ended, then the year it started.
export const newestFirst = (a: Project, b: Project) =>
  (b.data.to ?? b.data.from) - (a.data.to ?? a.data.from) || b.data.from - a.data.from;
