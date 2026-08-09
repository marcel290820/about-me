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
- Theme tokens are defined in a `@theme {}` block — use these CSS variables, not raw color values.
- **Two zones.** The page opens on chart paper (`.zone-surface`) and crosses a waterline once into deep water (`.zone-deep`). `.zone-deep` remaps the semantic tokens (`--color-text`, `--color-surface-*`, `--color-border-*`, `--color-accent-soft`), so a Tailwind utility like `text-text-muted` follows the zone on its own. Style with semantic tokens, never with the fixed anchors (`--color-paper`, `--color-abyss`, `--color-cream`, `--color-ink`) unless the value must stay constant across both zones.
- Accent is `--color-buoy` (`#E4572E`). On paper it measures 3.12:1, so restrict it there to large text, rules and marks — never body copy. `--color-foam` (`#7FD1C0`) is reserved for live/dynamic values and is deep-zone only.
- Type: `--font-sans` is Archivo variable. Use `.display-name` for headings (expanded, fluid `clamp()`), `.label` for condensed uppercase section lettering. `--font-mono` is IBM Plex Mono, for data and small caps labels only.
- Reusable component classes (`.card`, `.tag`, `.btn-primary`, `.chip`, `.rail`, `.portrait-ring`, `.waterline`, `.depth-rail`) live in `@layer components`. Use Tailwind utilities inline for layout/spacing. No CSS modules, no styled-components.
- Border radius is `2px` everywhere. Transitions: `0.15s ease` for color/text, `0.2s ease` for background/border, `0.4s ease` for zone recolouring.
- Aesthetic is a nautical chart: hairlines, crop marks, soundings. **No glow shadows** — they were removed on purpose. Depth and emphasis come from hairlines and the orange rule.

### Live sea state

`Base.astro` fetches Open-Meteo Marine (no key, CORS open) for the Baltic off Rostock and sets `--sea-state` (0-1). Scroll sets `--attenuation` (1 at the surface, 0 at 48m) and `--depth-pct`. If the fetch fails the CSS defaults hold and readouts stay `--`, so never make layout depend on the response.

`--sea-state` drives how rough the water looks, never whether it looks like water: a calm Baltic reports about 0.08, so every amplitude needs a floor under it. Every animation must also survive `prefers-reduced-motion` — either multiply the moving term by `var(--motion)` (which the query zeroes) or set `animation: none` in the query, whichever the keyframe allows. Shape is not motion: the waterline keeps its live amplitude when the travel stops.

### Where the water moves

Three layers, animated with transform and opacity only so they stay on the compositor. Motion is graded by depth, which is also the rule for anything added later.

- **Paper (`.zone-surface`) is deliberately still.** It is ink on a chart, and holding it still is what makes the water below read as moving. Do not animate it.
- **`.waterline` carries two swell trains** at incommensurate periods, so their crests drift in and out of phase instead of looping. Each train is two tiles wide and travels exactly one tile per cycle (`translateX(-50%)`), which is what makes the loop seamless at any viewport width. The profiles are sums of sines with **integer** wave numbers over the tile, so `y(0) === y(TILE)` by construction — keep them that way or the wrap will jog. Soundings are printed chart data and stay put; the sea moves under them.
- **`.zone-deep::before` has a slow undertow**, further and slower than anything above, with a paired opacity breath standing in for light through moving surface water. Its `inset` is negative so the drift never drags an unpainted edge into view.

`data-zone` and `data-zone-low` on `<html>` track which zone sits behind the top and bottom of the fixed rail. Fixed-position chrome that crosses the waterline needs one of these, not a static colour.

## Search

Pagefind indexes the built site. CI runs `npx pagefind --site dist` after `astro build`. Search will not work in `npm run dev` without a manual index step, so don't debug "missing search" by editing code — build first.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml` on push to `master`. CI: `npm ci` → `npm run build` → `npx pagefind --site dist` → deploy. Custom domain `marcel-heidebrecht.de` is set via `public/CNAME`.

## Placeholders

`PLACEHOLDERS.md` tracks unfilled content slots (profile image, OG image, etc.). Check it before assuming a missing asset is a bug.

## Commit messages

Never add `Co-Authored-By: Claude ...` trailers to commit messages. No Claude attribution in commits at all.
