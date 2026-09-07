import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        // Named by what it does, never a brand. Longer than this wraps
        // the sheet's title block to a third line.
        title: z.string().max(48),
        domain: z.enum(['web3', 'web', 'infra', 'data', 'mobile']),
        // Reading order, lowest first. Hand-set: see src/lib/projects.ts.
        rank: z.number().int().positive(),
        description: z.string(),
        // Each name is a mark on the sheet's frame. Longer than sixteen
        // characters and it no longer fits its slot; see src/lib/sheet.ts.
        stack: z.array(z.string().max(16)).min(3).max(8),
        // How much of the work ran through each name, read off the commit
        // history when the sheet was drawn: `core` is where most of the
        // changed lines went, `touched` is what was wired up and then left
        // alone, and the rest is the middle tier. Both list names from
        // `stack`. The plate draws the bearing heavier the higher the tier.
        core: z.array(z.string()).default([]),
        touched: z.array(z.string()).default([]),
        // Who the sheet was drawn for. Sheets print in series by this and
        // the caption names it; the table is src/lib/orgs.ts.
        org: z.enum(['cct', 'tub', 'own', 'client']),
        from: z.number().int(),
        to: z.number().int().optional(),
        url: z.string().optional(),
        // A public repository. Left out, the source is private and the
        // sheet says so in the place the link would print.
        repo: z.string().url().optional(),
        // A screenshot of the live site, taken by scripts/shoot-previews.sh.
        // The date is when it was taken: the plate is a survey of the site,
        // not a window on it, and it says so under the frame.
        preview: z
          .object({
            src: image(),
            surveyed: z.coerce.date(),
            // Whether the site itself is light or dark. One knock-back for
            // both lands a white page brighter than the plate it belongs to
            // and a dark one below legibility; each tone gets its own.
            tone: z.enum(['light', 'dark']),
          })
          .optional(),
      })
      .refine((p) => !p.preview || p.url, {
        message: 'a preview needs the url it was surveyed from',
        path: ['url'],
      })
      .refine((p) => [...p.core, ...p.touched].every((n) => p.stack.includes(n)), {
        message: 'core and touched name entries of the stack',
        path: ['core'],
      })
      .refine((p) => !p.core.some((n) => p.touched.includes(n)), {
        message: 'a name is core or touched, not both',
        path: ['touched'],
      }),
});

const interests = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/interests' }),
  schema: z.object({
    title: z.string(),
    icon: z.string(),
    description: z.string(),
    category: z.enum(['hobby', 'sport', 'other']),
  }),
});

export const collections = { blog, projects, interests };
