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
        from: z.number().int(),
        to: z.number().int().optional(),
        url: z.string().optional(),
        repo: z.string().optional(),
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
