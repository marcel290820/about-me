# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server on `localhost:4321`
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the built site locally
- No test, lint, or typecheck scripts exist. Verify changes with `npm run build`.

Node 22+ is required (`engines` in `package.json`). Deploy is automated — never run a manual deploy step.

## Architecture

Astro 6 static site, no JS framework islands (no React/Vue/Svelte). Pages are `.astro` files; rich content is MDX.

- **Path alias**: `@/*` → `src/*`
- **Content collections** are defined in `src/content.config.ts` with a `glob` loader. The Zod schemas there are the source of truth for frontmatter — when adding a new field, update the schema first.
- Three collections: `blog` (md/mdx, has `draft` field), `projects`, `interests`. Blog posts with `draft: true` are filtered out of listings.
- `src/content/` files are read via Astro's content collections API (`getCollection`), not raw filesystem reads.
- Routes live in `src/pages/`; layouts (`Base`, `Page`, `BlogPost`) in `src/layouts/`; reusable UI in `src/components/`.

## Styling

- **Tailwind CSS v4** wired in via `@tailwindcss/vite` (not PostCSS). All custom CSS lives in a single file: `src/styles/global.css`.
- Uses v4 syntax — `@import "tailwindcss"` and `@plugin`, **not** v3's `@tailwind base/components/utilities` directives.
- Theme tokens are defined in a `@theme {}` block — use these CSS variables, not raw color values. The accent glow token `--color-accent-glow: rgba(56, 189, 248, 0.45)` should be used for all glow/shadow effects.
- Reusable component classes (`.card`, `.tag`, `.btn-primary`, `.chip`, `.rail`, `.portrait-ring`) live in `@layer components`. Use Tailwind utility classes inline for layout/spacing and the custom classes for visual effects. No CSS modules, no styled-components.
- Border radius: `3px` for buttons/tags, `4px` for cards/images/chips. Transitions: `0.15s ease` for color/text, `0.2s ease` for background/shadow.
- Aesthetic is dark terminal — keep effects subtle and restrained.

## Search

Pagefind indexes the built site. CI runs `npx pagefind --site dist` after `astro build`. Search will not work in `npm run dev` without a manual index step, so don't debug "missing search" by editing code — build first.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml` on push to `master`. CI: `npm ci` → `npm run build` → `npx pagefind --site dist` → deploy. Custom domain `marcel-heidebrecht.de` is set via `public/CNAME`.

## Placeholders

`PLACEHOLDERS.md` tracks unfilled content slots (profile image, OG image, etc.). Check it before assuming a missing asset is a bug.
