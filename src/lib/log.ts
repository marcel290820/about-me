import type { CollectionEntry } from 'astro:content';

/** Nothing is being written at the moment, so the log stays off the built
 *  site: nothing links to it and no entry page is generated. It still prints
 *  under `astro dev`, where the chart table previews a draft against the real
 *  page. Set to `true` to publish the log again, and drop the sitemap filter
 *  in `astro.config.mjs` with it. */
export const SHOW_BLOG = import.meta.env.DEV;

const WORDS_PER_MINUTE = 200;

/** Reading time from raw text, one minute at least. */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A date the way the log prints it: 06 Sep 2026. Built by hand because
 *  en-GB ICU spells September "Sept". */
export function logDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${day} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function newestFirst(a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>): number {
  return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}
