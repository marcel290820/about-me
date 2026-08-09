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
- **`.drift` carries marine snow and the contacts.** See below.
- **`.shallows` rides the swell.** One `ride` keyframe moves everything at the surface together, at different periods. See below.

`data-zone` and `data-zone-low` on `<html>` track which zone sits behind the top and bottom of the fixed rail. Fixed-position chrome that crosses the waterline needs one of these, not a static colour.

### The water column (`Drift.astro`)

Two fields of marine snow on `.drift::before` / `::after`, plus a library of twenty species in `<template>` elements. Snow is what makes the deep read as water with volume instead of a dark background, so keep both fields: one alone reads as dust on the lens. Each field falls **exactly one tile** per cycle (`background-size` y == the keyframe's `translate3d` y) or the loop seams, and `top` overhangs by more than the longest fall so it never drags an unpainted edge into frame.

The layer is `position: fixed` and costs one viewport however long the page runs. It sits at `z-index: -1` inside `.zone-deep`: above the zone background and the contours, behind every word. The whole layer is gated to `opacity: 0` while `data-depth` is `dry`, because it is painted after the paper and would otherwise snow indoors. That gate reads `--lit`, so the narrow-screen rule can pull the layer back without out-specifying it.

**Contacts are spawned in the browser, not authored in CSS.** The `SPECIES` table carries band, mode, size, lane, duration, settled opacity and reaction; the script clones a template, assigns a lane and a heading, and removes the contact on `animationend`. Two rules keep it from reading as a loop: no species may be live twice at once, and lanes stay 15% apart (risers exempt both ways). The lane rule takes the roomiest of eight draws rather than the last one — where two species share most of their band, using whatever the final throw happened to be puts them in one lane. Cap is three contacts, two under 760px.

**A band stocks on arrival, seeded.** Leaving it to the spawn chain put the first contact up to nine seconds out, and a crossing then spends its first quarter beyond the left edge before it is visible at all, so a band you scrolled into stayed empty for half a minute and the water appeared to start at whatever scroll height you happened to stop at. `stock()` fills to the cap on every band change and at load, and `spawn(true)` gives the animation a negative delay so the contact is already in frame. The fractions passed to `lead()` are the part of each keyframe that is actually on screen; they need recomputing if the `drift-cross-*` or `drift-rise` distances change.

Every figure in the library is **drawn facing right**, and heading is `--flip` on `.drift__body`. That is the only reason nothing swims backwards — it is one rule in one place rather than a fact about twenty drawings. Any new figure must face right too.

`data-depth` on `<html>` (written in `Base.astro`) picks the band: `dry | shallow | mid | abyss`. It stays `dry` until the waterline's bottom leaves the top of the frame — the layer is fixed, so anything sooner swims over the paper — and the three bands then split **what is left after that point** into even thirds. Do not band on raw scroll progress: a page with a tall surface block spends a third of its scroll dry and leaves the shallow band a sliver.

Poking is proximity, not hit testing: the layer takes no pointer events, so `pointermove` measures against each live figure's box (an ellipse test, not a radius, or a 40px probe on a 300px wire answers from across the page). Reactions are per species and there are five: `flee`, `lunge` (the anglerfish comes to look), `pulse`, `jet` (ink), `ping` (machines answer instead of running). `.drift__body` transitions out in 0.42s and back in 2.4s — the dart is the reaction, the long drift back is it settling.

Colour is load-bearing: `--color-foam` is telemetry and only telemetry (the ROV light, the CTD sensor, the tagged fish's ping, the barreleye's eyes). `--color-buoy` is the one warm mark — the anglerfish lure and the oarfish crest, which sit two bands apart and never share a frame.

Figures are drawn hairline and unfilled, like a sounder or a field notebook records something rather than how an illustration pictures it. Anything with a curve comes out of `src/lib/curves.ts` (`spine` → `shell`/`ridge`/`rays`), because hand-fitting a silhouette is how the manta that used to swim here kept coming out an umbrella, and how the dumbo octopus that replaced it came out a lamb. If a new figure has parts that must line up, sample them from one source.

Four failure modes have each cost more than one attempt, and every one of them is a shape that is *too regular* for what it depicts:

- **Symmetry reads as manufacture.** A rock spire zigzagged evenly on both sides is a fir tree; the smoker only became a smoker when the two edges stopped matching and a second stump appeared beside it. Living and geological things are lopsided.
- **A closed rectangle is a box.** The ROV read as a briefcase until the frame became posts and rails with the middle bay left open, and the skids became two runners instead of one full-width plinth. You must be able to see through an open frame.
- **Tapering both ends of a body loses the front.** The oarfish read as swimming backwards for exactly this reason, and the turtle read as a surfboard. Give the head end its own profile: blunt, deeper, or walled.
- **A join that has to be hidden should not be drawn.** The carapace is two open edges rather than `shell()`, because the closing wall across the front cut through the head. Where a part emerges from another, leave the outline open and let them overlap.

### The surface (`Shallows.astro`)

The `dry` gate above is one screen of water long, and this is what fills it. `.shallows` is `position: absolute` at the top of `.zone-deep` rather than fixed: nothing here is passing through, it is moored to the surface or floating on it, so it is drawn once and scrolls away behind you. Three figures and a ceiling: a coaster overhead, the wave buoy on its mooring, a harbour porpoise and her calf.

That split is the point. Below, every contact travels on its own and none of it is attached to anything. Up here **one swell moves all of it**: a single `ride` keyframe at three different periods, floored the same way everything else is because a calm Baltic reports 0.08. The ceiling does not ride. It is printed chart data, like the soundings, and the floating things move against it.

Each figure hangs its own waterline off the ceiling at 40px with `top: calc(40px - var(--w) * k)`, where `k` is the waterline's y divided by the **viewBox width**. The height cancels out of that ratio, so one constant holds at every size. Changing a viewBox means recomputing `k`.

Two traps, both already paid for:

- **`mask-image` clips to the border box.** `mask-clip` defaults to `border-box`, so a mask on a figure silently deletes anything positioned outside it, which is where the labels sit. The mooring line fades through an SVG `linearGradient` on its own stroke instead. The mask on `.shallows` itself is fine: everything is inside that box.
- **`Drift.astro`'s script is inline, not a module.** `define:vars` implies `is:inline`, so it runs where it sits in the document, before this component exists. The poke system collects the moored figures on the first `pointermove` rather than at startup. Anything else in that script that reaches out of `Drift.astro` needs the same treatment.

Figures reuse `.drift__figure` / `.drift__body` / `.drift__tag` and carry `data-poke`, which is all it takes to join the water column's poke system. `data-jitter="lo hi"` sets the left range, `data-flip` allows a mirrored heading, and both are rolled in the browser; a figure is held back off the right edge by its own width, because the layer clips and a porpoise with its nose cut off reads as a bug.

### Chart marginalia (`ChartMarks.astro`)

Charts carry two registers and so does this: the notation (variation rose, wreck symbol, tidal diamond, GNSS note, a three-bearing fix on Berlin with its cocked hat) and everything cartographers drew in the empty water to sell the chart (a sea serpent wrapped round a telegraph cable, a fleet action, somebody's cache). Eight marks, five printed per visit in five of six margin slots, picked in the browser.

Paper does not move, so none of it animates. It is hidden below 1180px, where the content column takes the whole page and there is no margin to print in.

A mark prints 118px wide, so each of the two ships in the fleet action lands at about 30px. At that size a suit of sail has to be **one bellied shape per mast** with the yards ruled across it: six separate sails read as crates stacked on a raft, and thin arcs hung on spars read as bunting. Size the detail to where it is seen, not to the viewBox.

## Search

Pagefind indexes the built site. CI runs `npx pagefind --site dist` after `astro build`. Search will not work in `npm run dev` without a manual index step, so don't debug "missing search" by editing code — build first.

## Deploy

GitHub Pages via `.github/workflows/deploy.yml` on push to `master`. CI: `npm ci` → `npm run build` → `npx pagefind --site dist` → deploy. Custom domain `marcel-heidebrecht.de` is set via `public/CNAME`.

## Placeholders

`PLACEHOLDERS.md` tracks unfilled content slots (profile image, OG image, etc.). Check it before assuming a missing asset is a bug.

## Commit messages

Never add `Co-Authored-By: Claude ...` trailers to commit messages. No Claude attribution in commits at all.
