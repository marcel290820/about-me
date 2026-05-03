# AGENTS.md

## Commands

- `npm run dev` — dev server on `localhost:4321`
- `npm run build` — production build to `dist/`
- No test/lint/typecheck commands exist; verify changes with `npm run build`

## Architecture

- **Astro 6** static site, no JS frameworks (no React/Vue/Svelte islands)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (not PostCSS). Styles live in `src/styles/global.css` using `@theme` tokens + `@layer components` classes
- Path alias: `@/*` → `src/*`
- Content collections defined in `src/content.config.ts` using `glob` loader — schemas are the source of truth for frontmatter fields
- Three collections: `blog` (md/mdx, optional `draft` field), `projects`, `interests`
- Blog posts with `draft: true` are filtered out of listings

## Styling conventions

- All custom CSS in single file: `src/styles/global.css`
- Theme tokens in `@theme {}` block — use these variables, not raw colors
- Accent glow token: `--color-accent-glow: rgba(56, 189, 248, 0.45)` — use for all glow/shadow effects
- Component classes (`.card`, `.tag`, `.btn-primary`, `.chip`, `.rail`, `.portrait-ring`, etc.) are in `@layer components`
- Tailwind utility classes inline in templates for layout/spacing; custom classes for visual effects
- No CSS modules, no styled-components
- Border radius: `3px` (buttons/tags), `4px` (cards/images/chips)
- Transitions: `0.15s ease` for color/text, `0.2s ease` for background/shadow/box-shadow
- Design is dark terminal aesthetic — keep effects subtle and restrained

## Deploy

- GitHub Pages via `.github/workflows/deploy.yml` on push to `master`
- Node 22 required (engines field in package.json)
- CI runs `npm ci` → `npm run build` → `npx pagefind --site dist` → deploy
- Custom domain: `marcel-heidebrecht.de` (via `public/CNAME`)

## Gotchas

- Tailwind is v4 (uses `@import "tailwindcss"` and `@plugin`, not v3 `@tailwind` directives)
- Pagefind indexing is a separate step after build — search won't work in `npm run dev` without manual indexing
- `src/content/` files use Astro content collections API, not raw filesystem reads
