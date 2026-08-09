# Sounding: visual redesign

Date: 2026-08-09
Status: approved, ready to build

## Scope

Visual redesign only. Every word of copy on the site stays exactly as it is. No
new sections, no reordered content, no rewritten bio. The one addition is a live
sea-state readout, which the site owner asked for explicitly.

The current site uses a near-black background, a cyan accent, Inter, JetBrains
Mono, a `//` section prefix, a `$ ` shell prompt, a blinking cursor and a 56px
grid background. That combination is the default developer-portfolio look. The
redesign replaces it.

## Concept

The page is a water column. It opens at the surface on chart paper, crosses a
waterline once, and continues into deep water.

Structure comes from hydrographic charts and depth instruments: soundings,
isobath contours, tick borders, a depth gauge. There is no literal ocean
imagery. No waves, no boats, no bubbles, no blue gradient.

The sea is the grammar, never the subject. Nothing on the page announces a
hobby. The result reads as precise and instrumented.

One physical idea ties the page together: **live sea state drives the surface,
and depth attenuates it.** Real wave height off Rostock sets how restless the
top of the page is. That motion dies out as the reader descends, the way it
does underwater. The hero moves. At 48m the page is still.

## Palette

Contrast ratios are computed, not estimated.

### Above the waterline

| Token | Value | Role |
|---|---|---|
| `--paper` | `#F1ECDF` | chart buff, page ground |
| `--ink` | `#10222E` | body text, 13.8:1 on paper (AAA) |
| `--ink-muted` | `#4A5C66` | secondary text |
| `--sounding` | `#7C8B93` | printed depth numerals |
| `--hairline` | `#C9C1B0` | every rule on the page |

### Below the waterline

| Token | Value | Role |
|---|---|---|
| `--abyss` | `#06141B` | deep water, blue-green-black |
| `--water` | `#0B2B33` | raised surfaces |
| `--water-raised` | `#103A44` | hover state |
| `--cream` | `#EAE3D3` | body text, 14.6:1 on abyss (AAA) |
| `--cream-muted` | `#93A3A6` | secondary text |

### Shared accents

| Token | Value | Role |
|---|---|---|
| `--buoy` | `#E4572E` | safety orange. 5.07:1 on abyss (AA body). 3.12:1 on paper |
| `--foam` | `#7FD1C0` | seafoam. 10.5:1 on abyss. Below the waterline only |

Two rules keep the system disciplined:

- **`--paper` and `--cream` are nearly the same warm off-white.** What you read
  on at the top becomes what you read in at the bottom. That inversion is what
  makes two zones feel like one site instead of two themes.
- **`--foam` is reserved for things that are alive**: the gauge readout and the
  live data, nothing else. Motion gets its own color.

Because `--buoy` measures 3.12:1 on paper, above the waterline it is restricted
to large text (24px and up, or 18.66px bold), rules and marks. Never body copy.
Below the waterline it clears AA at 5.07:1 and can be used freely.

## Typography

| Family | Axes / weights | Role |
|---|---|---|
| Archivo | variable, `wdth 62-125`, `wght 100-900` | display and body |
| IBM Plex Mono | 400 / 500 / 600 | data and labels |

Both confirmed available on Google Fonts. Archivo ships as a single variable
file per unicode range with both axes, so the width range costs nothing extra.

Archivo was drawn for signage, which makes it a navigation face by origin. Its
width axis provides two personalities from one download:

- **Archivo Expanded 700, uppercase, `-0.03em`** for the name. Reads as a hull
  nameplate or an instrument bezel.
- **Archivo Narrow 600, uppercase, `+0.10em`** for section labels. Chart
  place-names are condensed and letterspaced; this is the detail that makes the
  page read as a chart.
- **Archivo regular** for body copy.
- **IBM Plex Mono** for coordinates, depths, dates, tags and the live readout.
  Its flat terminals and serifed `l` read as instrument print.

No high-contrast display serif. Cream background plus display serif is a
well-worn signature, and the upper half of this site is cream.

### Scale

1.25 ratio on a 16px base.

```
eyebrow   11px  Plex Mono, 0.18em, uppercase
small     13px
body      16px / 1.65
lead      19px
h3        20px  Archivo 600
h2        26px  Archivo Narrow 600, uppercase, 0.10em
h1        44px mobile / 72px desktop   Archivo Expanded 700
name      56px mobile / 96px desktop
```

## Layout

The current site is one 768px column with a uniform `mb-12` between every
section. Replace it with a two-track chart grid.

```
|<-- 88px -->|<---------- 680px ---------->|
|            |                              |
|   RAIL     |   CONTENT                    |
|            |                              |
|  0 -|      |   MARCEL HEIDEBRECHT         |
|     |      |   Fullstack Engineer /       |
| 12 -+      |   DevOps Enthusiast          |
|     |      |                              |
|  >  |  <-- current depth marker           |
| 24 -+      |   EXPERIENCE                 |
|     |      |                              |
| 36 -+      |                              |
|     |      |                              |
| 48 -'      |   [ live readout ]           |
```

Container widens from `max-w-3xl` to `max-w-5xl` (1024px), laid out as a
`88px 1fr` grid. On mobile the rail collapses to a 3px left edge bar plus a
small fixed depth badge in the bottom-left corner.

The rail is functional, not decorative: it is the scroll indicator, the section
marker and the live instrument, in a column the current design leaves empty.

**Page edge.** Hairline latitude and longitude ticks along the left and top of
the viewport at 6% opacity. Nearly invisible, and the thing that makes the page
read as a chart rather than a document.

### Spacing rhythm

```
section gap      128px desktop / 72px mobile
block gap         40px
within a record    8 / 12 / 20
```

Sections breathe further apart, records tighten. The contrast between the two
creates the rhythm the current site lacks.

### Background texture

Delete the 56px grid. Replace with one fixed inline SVG: scattered two-digit
sounding numerals at 10% opacity plus three hairline isobath contours.
Soundings thin out with depth, because the deep cannot be sounded.

## The waterline

One crossing per page, placed after the hero on `/` and after the bio paragraph
on `/about`.

Not a wave divider. A **sounding profile**: a hairline stepped path with
sounding dots below it, printed the way a seabed transect is.

```
  . 08     . 11        . 09
 _____                    ____
      \____        _______/
           \______/                <- hairline profile, dots are soundings
=======================================
                                   <- paper fades to abyss across this band
       . 34      . 41      . 38
```

The band is roughly 160px tall. Three things switch across it: ground color,
text color, and the depth gauge starts counting down from 0.

The amplitude of the profile line is set by live wave height, so the data shows
up visually before any number is read.

## Signature: depth gauge fused with live sea state

### Depth model

One formula, no per-section configuration:

```js
depth = (scrollY / scrollableHeight) * 48   // every page bottoms out at 48m
```

Ticks at 0 / 12 / 24 / 36 / 48. The marker rides the rail. The readout is
Plex Mono in `--foam`.

### Live block

Anchored at the base of the rail:

```
ROSTOCK
54.25N  12.10E
Hs    0.2 m
SST  20.5 C
```

Source: Open-Meteo Marine API. Verified 2026-08-09: no API key required,
returns `access-control-allow-origin: *`, and `54.25,12.10` resolves to a sea
cell (`elevation 0.0`) in the Baltic off Warnemuende, Rostock's seafront.

```
https://marine-api.open-meteo.com/v1/marine
  ?latitude=54.25&longitude=12.10
  &current=wave_height,sea_surface_temperature
```

The readout is deliberately understated. It reads as an instrument, not as a
biography.

### The fusion

One fetch sets two CSS custom properties:

```css
--sea-state: 0.34;   /* wave height, normalized 0-1 */
--attenuation: 1;    /* 1 at the surface, 0 at 48m, updated on scroll */
```

Three things consume `calc(var(--sea-state) * var(--attenuation))`:

1. amplitude of the waterline sounding profile
2. drift speed of the contour layer (1-3px, 8-20s period, sub-perceptual)
3. a small vertical bob on the depth marker

The page is restless where the reader arrives and glassy where they read. On a
rough day in the Baltic the site is visibly more agitated than on a calm one.

### Failure and accessibility

Non-negotiable:

- **No network, or the API fails.** `--sea-state` keeps its `0.35` default and
  the readout renders `--`. No layout shift, nothing breaks.
- **`prefers-reduced-motion: reduce`.** All three consumers go to zero. The
  numbers still render.
- The scroll handler is throttled with `requestAnimationFrame` and writes a
  single custom property. It never touches layout.

## Component map

Content is unchanged in every row below. Only the shell changes.

| Current | Becomes |
|---|---|
| `.section-heading` with `//` | Archivo Narrow uppercase, hairline rule ending in one sounding dot |
| `.term-label` with `$ ` prompt | Plex Mono eyebrow with a lat/long tick mark |
| `.cursor` blinking block | deleted |
| `marcel@heidebrecht:~` header mark | name in Archivo Narrow, no shell prompt |
| `.rail` timeline | log-book row: date in Plex Mono in the rail column, hairline rule, dot at the entry |
| `.chip` | hairline box with corner ticks instead of the left bar, orange rule on hover |
| `.card` | same treatment, flat, no glow |
| `.tag` | small Plex Mono pill, hairline outline |
| `.btn-primary` / `.btn-ghost` | flat, hairline, orange on hover |
| `.portrait-ring` | porthole: circular crop, double hairline ring, inner shadow |
| 56px grid background | soundings and isobaths |
| `>` and `::` markers in `PostCard` | Plex Mono date only, hairline separator |

## Images

The existing portrait is the only photograph. It gets a porthole crop:
circular, double hairline ring in `--ink`, subtle inner shadow. On `/` it sits
above the waterline so it stays on paper. On `/about` the same crop, smaller.

No stock photography, no illustration, no invented imagery. The chart texture
carries the rest, which is why this direction works without a photo library.

Two open items already tracked in `PLACEHOLDERS.md`:

- **OG image**: 1200x630 chart crop with the name in a title block.
- **Favicon**: a single sounding mark or depth tick, orange on paper.

## Deletions

Subtraction does the most work here. Each of these is a generic
developer-portfolio marker:

1. **All glow shadows.** `--shadow-glow-sm`, `--shadow-glow`,
   `--color-accent-glow` and roughly 12 `box-shadow` glows. Replaced by
   hairlines and one orange rule. This changes the site's character more than
   the palette does.
2. The `//` section prefix and the `$ ` shell prompt label.
3. The blinking terminal cursor.
4. The 56px grid background.
5. `marcel@heidebrecht:~` in the header.
6. `~` as the home nav label.

## Build order

Six commits, each independently shippable.

1. **Tokens.** Rewrite the `@theme` block: palette, fonts, spacing scale. Swap
   the Google Fonts link. Site builds but looks half-dressed.
2. **Layout shell.** `Base.astro` grid, rail column, page edge ticks,
   background SVG. Delete the grid and the glows.
3. **Components.** `@layer components` rewrite, plus `Header`, `Footer`,
   `PostCard`, `ProjectCard`, `TagList`, `SocialLinks`.
4. **Waterline and zones.** Surface and deep token scoping, the sounding
   profile divider. Applied to `/` and `/about`.
5. **Gauge and live data.** Depth scroll, marine fetch, the
   `--sea-state` / `--attenuation` fusion, offline and reduced-motion paths.
6. **Remaining pages.** `blog/`, `blog/[slug]`, `projects`, `search`. The
   search page carries roughly 290 lines of Pagefind CSS overrides, so it gets
   its own pass.

## Verification

This repository has no test, lint or typecheck script. The check is
`npm run build` after each commit, plus a visual pass on `localhost:4321`.

## Rejected

- **Animated voyage track with waypoints.** That is content, and the brief
  froze content.
- **Dive log widget.** Same reason.
- **Admiralty direction** (light chart paper throughout). Cream plus serif sits
  too close to a common template look, and it discards the dark site entirely.
- **Water column direction** (all dark). Kept in reserve. It is this system
  with the light zone removed, which is a one-flag change if the waterline
  crossing does not land.
