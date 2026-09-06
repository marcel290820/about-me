# Projects: chart sheets

Date: 2026-09-06
Status: direction picked by the owner (of three mocked), spec adapted

## Scope

Fill the empty projects section with a format a stranger can scan in
thirty seconds. Replace the unused `ProjectCard` grid with a design that
belongs to this chart, and add the first entry.

No project detail pages. No case studies. The stories, if they get written,
go in the blog. An entry carries the minimum: what domain, what it is, what
it is built with, when. Nothing else.

No brand names and no company names, anywhere in the section. Companies are
on the CV already and some of the work sits under NDAs. An entry is described
by what it does, never by who it was for. Links to a live site or a repo are
allowed only where the link itself gives nothing away; the first entry has
none.

## Audience

Recruiters and hiring managers first. They arrive from the CV, want to know
whether "full-stack and DevOps" means anything concrete, and leave within a
minute. Engineers are the second reader and get the same page: the stack is
precise enough for them.

This sets the tone. One plain sentence per project, two at most. Stack as a
list of names. No claims about impact, no numbers, no adjectives.

## Concept

A chart sheet is one plate: a ruled frame with the printer's corner ticks, a
faint graticule, and a title block in one corner. A navigator fixes a
position on it by taking bearings on known marks and drawing the lines in;
where they cross is where the thing is.

Each project is one sheet. Its stack is the set of marks: every name sits on
the frame edge with a tick, and its bearing line runs in to the fix. The fix
is the project. The title block carries the name, the domain and the year.
Under the plate, one sentence says what it is.

The page opens on the paper with the title block, crosses the waterline, and
prints the sheets in the water, one per project, newest first. The plate
reuses `.portrait-inset`, so the sheets are printed by the same hand as the
portrait on the about page.

## Content model

`src/content/projects/*.yaml`, one file per project, no body. The collection
keeps its glob loader. The schema in `src/content.config.ts` becomes:

| Field | Type | Meaning |
|---|---|---|
| `title` | string, max 48 chars | The thing, named by what it does. Never a brand. |
| `domain` | enum | `web3`, `web`, `infra`, `data`, `mobile`. Prints in the title block. |
| `description` | string | One sentence on what it is and what I built. Two at most. |
| `stack` | string[], 3 to 8 items, each max 16 chars | Most telling first. Each name becomes a mark. |
| `from` | number | Year the work started. Sort key. |
| `to` | number, optional | Year it ended, if different from `from`. |
| `url` | string, optional | Live site. Only where the link reveals nothing. |
| `repo` | string, optional | Source. Same rule. |

The length caps are what keeps the plate legible: a name longer than sixteen
characters does not fit its slot, and a title longer than forty-eight wraps
the title block to a third line. The schema enforces them so a bad entry
fails the build instead of printing a broken sheet.

Dropped from the old schema: `tags` (now `stack`), `featured`, `sortOrder`,
`startDate`, `endDate`. Order comes from `from` and `to`, newest first.

There is no per-domain drawing. The domain is a word in the title block.
The only symbols are the stack logos, one per name, and the owner wants
every framework and library shown by its logo: a new stack name gets a row
in `src/lib/logos.ts` with its entry.

## Page layout

`/projects` uses `Page` with the `surface` slot, like the about page.

On the paper: the `display-name` heading "Projects", the mono subtitle
"catalogue of sheets" in the blog index's style, and one line in the
site's voice: "What I've put to sea so far, and what it was built from."
Nothing else prints on the paper. The owner cut a longer intro and a
mark/bearing/fix key from here: the sheet explains itself, and a page
that explains its own design reads as weird.

In the water: the sheets, one column, full width of the content column,
newest first, with `space-y-16 sm:space-y-24` between them. No domain
sections and no rules between sheets: the frame is the separator.

## The sheet

One component, `src/components/Sheet.astro`, taking one collection entry.
It renders an `article.sheet` holding the plate, the title block, and the
text under the plate. Its CSS goes in `src/styles/global.css` under
`@layer components`, next to the passage plot, because that is where all
custom CSS lives.

The geometry, where the fix sits and where each mark and its name print,
is a pure function in `src/lib/sheet.ts`, so the collision rules can be
checked without a browser. `src/lib/sheet.test.ts` runs under `node --test`
and is the one runnable check this section leaves behind: with the widest
names the schema allows, no name leaves the frame, touches another or
covers the title block. `npm test` runs it, and `.claude/check.sh` and the
deploy workflow run `npm test` before the build.

### The plate

`figure.portrait-inset` at full width, with the SVG inside
`.portrait-inset__frame`, `viewBox="0 0 640 300"`, `width: 100%; height:
auto`, `fill="none" stroke="currentColor"` in `text-text`. The plate is
about 720px wide on desktop and 590px at `sm`.

Below `sm` a second plate prints instead, portrait, `viewBox="0 0 320
360"`, logos only: at a third of its drawn size the landscape sheet is a
strip and the marks are specks, and the portrait one keeps the idea at
358px wide. Both plates are in the markup and CSS shows one; each has its
own slot ranges, fix band and title-block cover in `src/lib/sheet.ts`
(`WIDE`, `TALL`), and the check runs on both. The names print under the
description on a phone (item 2 under the plate).

Bearings carry their degrees: true bearing from the fix to the mark, north
up, three digits at 7.5 units in `text-text-dim`, set along the stroke a
third of the way in from the mark and kept upright.

Layers, back to front:

1. Graticule. Verticals at a quarter, a half and three quarters of the
   width, horizontals at a third and two thirds of the height. Stroke 0.5
   at 0.22 opacity.
2. Marks. Each stack name is a landmark on the frame, drawn the way a
   chart draws one: its logo as the symbol, 16 units square and centred 14
   in from the edge, with the name beside it. Logos are monochrome 24x24
   marks in `src/lib/logos.ts`, from Simple Icons where one exists (CC0),
   Devicon for Playwright (MIT, the masks as one silhouette with the
   features knocked out in the surface colour), and drawn by hand for
   Anchor, which has no fetchable logo and is a chart symbol anyway. A name
   with no row there prints as a 6-unit tick instead. Marks take all four
   frames, because bearings have to arrive from opposing quadrants or the
   fix is a spray from one arc. The split by stack size (top, right,
   bottom, left): 3 names 1/1/0/1, 4 names 2/1/0/1, 5 names 2/1/1/1,
   6 names 2/2/1/1, 7 names 3/2/1/1, 8 names 3/2/1/2, filled in that
   order from the most telling name. Top slots spread across x from 80 to
   560, side slots across y from 50 to 200, the one bottom slot sits at
   x 470, right of the title block. Three top slots sit 160 units apart,
   and a logo with a sixteen-character name at 11 units and 0.04em
   tracking reaches 125 units from its slot, so neighbours clear each
   other; two side slots sit 75 apart, which clears a logo with its name
   above or below it.
3. Bearings. One hairline from under each logo (or the tick's inner end)
   to the fix, stroke 0.6 at 0.7 opacity, `pathLength="1"` for the
   draw-on. Hovering any part of a mark lights its bearing in the accent
   and drops the others to 0.2, so eight lines into one point can be read
   one at a time.
4. Names. Mono, 11 units, `text-text-muted`, the passage's knockout stroke
   in the surface colour so a name crossing a graticule line stays legible.
   One anchoring rule per frame: on the top and bottom edges the name
   prints to the right of its logo, whose body the bearing starts under;
   on the side edges it prints above or below the logo, on the side away
   from the fix, so its own bearing never crosses it. A mark without a
   logo keeps its name away from the fix on every edge.
5. The fix. The passage plot's fix marker, made the heaviest thing on the
   sheet because it is the point: a radius-4 ring at stroke 1.3 with the
   surface fill, so the bearings stop at it, inside a dashed circle of
   radius 10 with four ticks, like the cocked-hat mark in the margin. The
   graticule sits under everything at 0.14 opacity so the hierarchy runs
   fix, marks, bearings, grid. No orange at the fix: the two orange dot
   systems on this chart are the heading rule and the soundings, and this
   is not a third.

The fix sits near the middle, a little high: x from 300 to 380, y from 98
to 140, both picked by a small deterministic hash of the title. The band
lies between the two side slots, so a pair of marks facing each other
across it never draws one flat line through the fix. The graticule is
hashed from the title too, verticals every 160 and horizontals every 100
from an offset of its own, so no two sheets share a grid. Nothing of this
is a field in the yaml.

The test `src/lib/sheet.test.ts` also walks every bearing and asserts it
crosses no other mark's name or logo and never the title block.

Why the marks sit on the frame and not at the ends of floating lines: the
mock put names at the line ends and they collided with each other and with
the title block. Marks on the edge have slots, and slots do not collide.
The 16-character cap is what makes a slot wide enough.

### The title block

HTML, not SVG text, so it wraps instead of truncating and holds its font
size on a phone. Absolutely positioned inside `.portrait-inset__frame` at
the bottom-left, over the plate's corner, `max-width: 60%`, with the
frame's 1px `border-border-bright` rule and the surface background, so the
graticule stops at its edge. Padding `0.5rem 0.75rem`.

Two lines. The title in `.label` lettering (condensed uppercase) at
`0.8125rem` semibold in `text-text`. Under it the meta line in mono
`0.6875rem` uppercase tracked `text-accent`: the domain word at the left,
the years pushed to the right, no separator. A range prints as `2024 to
2025`; one year prints alone. Below `sm` both drop two steps (`0.6875rem`
and `0.5625rem`) so the block stays one title line and clears the lower
left-edge mark.

Under the frame, right-aligned in the inset's caption style: `sheet 01 of
08`, the sheet's place in the catalogue, so one entry reads as a catalogue
with one sheet rather than a thin page.

The bearings never reach the bottom-left because every mark is on the top
or right edge and the fix is in the upper right, so the block covers
nothing but graticule.

### Under the plate

1. The description, `mt-4 text-[0.9375rem] text-text-muted`.
2. Below `sm` only: the stack as one wrapping mono `text-xs text-text-dim`
   line, each name with its logo inline before it, names set apart by a
   gap and nothing else. On a phone
   the plate is 358px wide and an 11-unit name is 6px tall, so the names
   in the plate are hidden there (`display: none` on the name group) and
   this line carries the stack instead. At `sm` and up the line is for
   screen readers only (the plate is hidden from them) and the plate
   carries it for everyone else. One fact, printed once at every width.
3. If `url` or `repo` is set: "live" and "source" links in the mono
   uppercase style the old card used, `text-text-muted` to `text-accent`
   on hover.

Sheets are not links and have no hover state of their own. The inset's
frame recolours on hover because the portrait's does; that stays, it is
the class's behaviour. Only the two optional links respond to the pointer
otherwise.

## Motion

Paper does not move. The title block on the paper is still.

In the water a sheet takes its fix the first time it enters the frame. Each
bearing draws from its mark to the fix over 0.9s, staggered 90ms by mark
index, and the fix marker comes up when the last line lands. Names and
ticks are already printed; only the lines move. `pathLength="1"` and a dash
offset from one to zero, the passage's construction, with the same arming
rule: without script, or under `prefers-reduced-motion`, the sheet is
complete and simply prints. The observer and the settle handler in
`Passage.astro` are the pattern to copy into `Sheet.astro`, not a shared
module; two copies of twenty lines cost less than an abstraction over two
callers.

Nothing else animates.

## Home

The "featured projects" section becomes "projects" and prints the newest
sheet, one, where the card grid sat. The "all projects" link stays under
it. One sheet is a full plate; three would be the projects page again.

## Deletions

- `src/components/ProjectCard.astro`
- The tag cloud at the top of the old projects page
- `featured`, `sortOrder`, `startDate`, `endDate`, `tags` from the schema
- `src/pages/mock/` (the three direction mock-ups, already removed)

## The first entry

`src/content/projects/prediction-markets.yaml`

```yaml
title: Prediction markets on Solana
domain: web3
description: >-
  Yes/no markets anyone can open from a link, stake SOL on and settle
  on-chain. Anchor program, Vue frontend, and the pipelines that build,
  test and deploy both.
stack:
  - Rust
  - Anchor
  - Solana
  - Vue 3
  - TypeScript
  - Playwright
  - GitHub Actions
  - Nginx
from: 2025
```

The owner confirmed the year and that the whole stack is their own work.
The stack was checked against the repo: Vue 3.5, TypeScript 5.9, Anchor
0.31, Playwright, Nginx config under `infra/`, four GitHub Actions
workflows.

## Build order

1. Schema in `src/content.config.ts`: drop the old fields, add `domain`,
   `stack` with its caps, `from`, `to`, the title cap. The first entry.
2. `src/lib/sheet.ts` and its check, `npm test`, wired into
   `.claude/check.sh` and the deploy workflow.
3. `Sheet.astro` with the SVG, the title block, the text, the draw-on
   script; its CSS in `global.css`. `/projects` rewritten: title block on
   the paper, sheets in the water.
4. Home: swap the card grid for the newest sheet. Delete `ProjectCard.astro`.
   `CLAUDE.md` collections and styling notes, `PLACEHOLDERS.md`.
5. Screenshots and the design critique.

## Verification

`npm test` and `npm run build` must pass clean, with no collection
warning. Then screenshots at 390px, 760px and 1280px, on the projects page
and the home page, through the design critique until the score holds.
Check in the screenshots that no name touches another, the title block or
the frame at any of the three widths.

## Rejected

- A chart legend: one ruled row per project with a per-domain symbol. Scans
  well but reads as a table, and the symbol library is a second drawing
  system the sheet does not need. Mocked as direction A.
- A sounding section (time on x, depth for date order). The graphic dies on
  a phone and every fact prints twice. Mocked as direction B.
- A two-column grid of plates. A grid of plates is a grid of cards,
  however the plates are drawn. One column, full width.
- The title block as SVG text. It truncates and scales down to nothing on
  a phone.
- Names at the ends of floating bearing lines. They collide; see above.
- Domain sections with `.section-heading`. With one entry per domain the
  chrome outweighs the content. The domain word in the title block does
  the job.
- An orange dot at the fix. That would be a third orange dot system.
- A `role` field. What I did belongs in the description's second sentence.
- Chips for the stack. Every portfolio has them.
