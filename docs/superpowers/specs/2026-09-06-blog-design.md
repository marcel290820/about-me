# Blog: the remarks column and the chart table

Date: 2026-09-06. Status: approved for planning.

## Goal

Two things. A reader view that is unmistakably this site and gets out of the way of reading. A writer view, for the owner only, that makes writing and publishing an entry one sitting with no file juggling.

The site is a nautical chart over a water column. The CV on `/about` already reads as a ship's log: entries pinned to a rail by date. The blog is the other half of that log, the remarks column, where the prose goes. One idea carries the whole thing: **you read on paper, you find your way in the water.**

## Decisions already taken

Taken with the owner on 2026-09-06.

- Writing happens on the owner's machine in `npm run dev`. No CMS, no auth, no backend on the live site.
- Entries are titled articles only. Short untitled notes are a possible later addition, not part of this.
- The text is written in the writer view itself, with a live preview beside it.
- Publish means: flip `draft`, commit the file, push. The deploy workflow does the rest.
- The `/blog` page calls itself "Remarks". The nav label stays "blog" and the URL stays `/blog`.
- Reading happens on the paper (surface zone). Wayfinding happens under the waterline.

## Content model

Collection `blog`, files in `src/content/blog/<slug>.md` (or `.mdx`). Schema in `src/content.config.ts`:

| field | type | required | notes |
|---|---|---|---|
| `title` | string | yes | |
| `description` | string | yes | one sentence; the remark in the log row, the deck on the entry, the RSS summary |
| `pubDate` | date | yes | |
| `updatedDate` | date | no | |
| `place` | string | no | where it was written; prints after the date like the CV's "Feb 2026, Berlin" |
| `tags` | string[] | default `[]` | |
| `draft` | boolean | default `false` | |

`heroImage` is removed. Nothing uses it and every optional field is a decision the writer has to make.

Draft handling changes: today a draft is hidden from listings but still built as a public page. After this work, `draft: true` entries are built only in dev (for preview) and skipped in the production build. Listings, RSS, tag pages and the home page already exclude drafts.

The slug is the filename. Slugs match `^[a-z0-9]+(-[a-z0-9]+)*$`.

## Reader

### The log: `/blog`

Surface slot, on paper. Heading "Remarks" in `.display-name`, under it one mono line: "whatever the instruments did not record". Below that the entries, newest first, grouped by year. Each year is a `.section-heading`. The entries in a year sit on one `.rail`.

A row is a log line, not a card:

- date line in `.rail__fix` (mono, dim): `06 Sep 2026, Berlin`, and the reading time after a hairline dash
- title, sans semibold, the whole row is one link, title goes accent on hover
- the remark (description) in one line, muted
- tags as `.tag` chips, linked to their tag page

Under the waterline: a "wayfinding" section with the topics as a soundings table (`dl` like the skills table on `/about`, tag name in the mono accent column, count on the right, each a link), then two lines: search and the RSS feed.

The `PostCard` component is deleted. The row becomes `src/components/LogEntry.astro`, the year grouping `src/components/Log.astro`.

### The entry: `/blog/<slug>`

Surface slot, on paper. Everything a reader needs to read is above the waterline; everything they might do next is below it.

Header:

- fix line: date, place, reading time, and in dev only the word "draft" when the entry is one
- title in the display voice one size down (`.display-name--entry`, roughly `clamp(1.5rem, 5vw, 2.4rem)`), so a ten word title takes two lines, not five
- description as the deck: one size up from body, muted
- tags as chips

Body: `.prose` at its default 65ch measure, not `max-w-none`. On paper the prose needs its own rules because the accent measures 3.12:1 there:

- body links are ink with an accent underline (`text-decoration-color`), hover turns the text accent
- inline code is ink on `--color-accent-soft`, not accent text
- `h2` takes the section-heading voice: condensed uppercase, the hairline, the dot at the end
- `h3` stays sentence case semibold
- code blocks print as water: Shiki on its css-variables theme, abyss ground, cream text, foam strings, buoy keywords. This is a site-wide change to the Shiki theme and stands unless the owner asks for Dracula back; the copy button stays
- tables and code scroll inside their own box, the page never scrolls sideways
- images keep the 2px radius and hairline

The `updatedDate`, when set, prints on the fix line as "updated 12 Oct 2026".

Under the waterline: "earlier" and "later" entries (previous and next by date, on the rail, title and date each), and a "back to the remarks" link. In dev only, an "edit" link into the writer. Structured data (`BlogPosting` JSON-LD) stays as it is.

Nothing else. No comments, no share buttons, no hero image, no related posts, no table of contents.

### Tag pages: `/blog/tags/<tag>`

Same page as `/blog` with the list filtered, heading `#tag` in the display voice, and no count line, the wayfinding table carries the count. The wayfinding section under the waterline lists the other topics.

### Home

The "recent posts" section keeps its place in the water and uses `LogEntry` rows on a rail instead of cards. Three entries, then "all remarks".

### Feed

`/rss.xml` stays. Items carry title, date, description, link. Drafts excluded, as now.

### Search

Pagefind already indexes the entry body through `data-pagefind-body`. No change beyond keeping that attribute on the new layout.

## Writer: the chart table

### Where it lives

`src/writer/` holds everything and nothing in it reaches the build:

- `integration.ts`: an Astro integration registered in `astro.config.mjs`. In `astro:config:setup` it injects the route `/write` only when `command === 'dev'`. In `astro:server:setup` it mounts the API middleware on the dev server. In `build` it does nothing, so `dist/` has no writer and no API.
- `write.astro`: the page. Its own layout, not `Base`. No header, no depth rail, no marine fetch, no water. It is a desk, not a page.
- `entry.ts`: the pure core. Parse a file into `{ frontmatter, body }`, serialize back, slugify a title, validate an entry. No I/O.
- `entry.test.ts`: one `node --test` file for the core.

Frontmatter is parsed and written with `js-yaml`, which Astro 6 already depends on and uses for the same job. It is pinned as a devDependency so the import is declared, not inherited.

### Routes

- `/write`: a new entry.
- `/write?entry=<slug>`: an existing entry.

One page, one query parameter. A dynamic `/write/<slug>` route would need `getStaticPaths` and a restart to learn about a new file; the query parameter does not.

### Layout

Two panes side by side, stacked under 900px (the writer is used on a laptop, but stacking is one grid rule).

Left, the sheet, on paper: ruled fields, each a hairline row with a mono label on the left like the soundings tables elsewhere on the site.

- title
- slug: filled from the title until the first save, then locked and shown as text. Renaming a file is done by hand.
- date: `<input type="date">`, defaults to today
- place: text, defaults to "Berlin"
- tags: comma separated text
- remark: the description, one line

Under the fields, the body: a plain `<textarea>` in IBM Plex Mono at 14px, filling the remaining height. Markdown, MDX if the file is `.mdx`.

Right, the preview: an `<iframe>` of `/blog/<slug>`, the real entry page. The dev server reloads it on save, so what the preview shows is what the site will build. It scrolls on its own.

A top bar across both panes: an "open" `<select>` of every entry (drafts marked), the save status, the draft state, and the publish button. A bottom line under the sheet: word count and reading time.

### Behaviour

- Autosave: 800ms after the last keystroke, `PUT` the entry. Cmd+S or Ctrl+S saves at once. The status line shows "saved 14:02:11" or "unsaved" or the error text.
- New entry: nothing is written until the title is non-empty. The first save creates the file and locks the slug; the URL updates to `?entry=<slug>` without a reload.
- Slug collision on first save: the API refuses, the status line says so, nothing is written.
- Draft: a checkbox. New entries start as drafts.
- Publish: sets `draft: false`, saves, then runs `git add <file>`, `git commit -m "post: <title>"`, `git push`. The button is disabled while it runs and the status line shows each step and any git output on failure. Publish is refused when anything else is already staged, so the commit only ever holds this one file.
- Reading time and word count update as you type, from the body only.
- Leaving the page with unsaved changes asks first (`beforeunload`).

### API

Mounted by the integration on the dev server, all under `/__writer/`, JSON in and out. Only reachable while `astro dev` runs on localhost.

| method and path | in | out |
|---|---|---|
| `GET /__writer/entries` | | `[{ slug, title, pubDate, draft }]` newest first |
| `GET /__writer/entry?slug=` | | `{ slug, frontmatter, body, ext }` |
| `PUT /__writer/entry` | `{ slug, frontmatter, body, create }` | `{ ok: true }` |
| `POST /__writer/publish` | `{ slug }` | `{ ok: true, output }` |

Rules the API enforces, at the boundary:

- slug matches the pattern above; anything else is 400. This is also what keeps the path inside `src/content/blog/`.
- `title`, `description`, `pubDate` present; `tags` an array of strings; 400 otherwise.
- `create: true` and the file exists: 409. `create` absent and the file is missing: 404.
- Writes go to a temp file in the same directory and are renamed into place.
- Git runs through `execFile`, never a shell string. The commit message is built from the title with newlines stripped.
- Any failure is a JSON error with the message; nothing is swallowed.

### What the writer does not do

Images (drop the file in `public/` and write the path), MDX components, renaming, deleting, multiple authors, scheduling, previews for anyone but the owner. Each is a later change if it ever earns one.

## Code layout

New:

- `src/components/LogEntry.astro`, `src/components/Log.astro`
- `src/writer/integration.ts`, `src/writer/write.astro`, `src/writer/entry.ts`, `src/writer/entry.test.ts`
- one draft sample entry in `src/content/blog/` for screenshots and the build check; the owner decides whether it stays

Changed:

- `src/content.config.ts`: schema
- `src/layouts/BlogPost.astro`: the entry on paper, wayfinding in the water
- `src/pages/blog/index.astro`, `src/pages/blog/tags/[tag].astro`, `src/pages/blog/[...slug].astro`: the log, the filter, the draft gate
- `src/pages/index.astro`: rows instead of cards
- `src/styles/global.css`: log rows, paper prose, `.display-name--entry`, writer desk
- `astro.config.mjs`: register the integration
- `package.json`: `js-yaml` and `@types/js-yaml` as devDependencies, a `test` script
- `.claude/check.sh`: run the test before the build
- `CLAUDE.md`: a section on the writer
- `.gitignore`: `.claude/worktrees/`

Deleted: `src/components/PostCard.astro`, `src/components/PaginationNav.astro` (unused), `src/components/Pagination.astro`.

`Pagination.astro` is replaced by `Neighbours.astro`, which is what it is now.

## Verification

- `.claude/check.sh` runs `node --test` on the core, then `npm run build`. Both green.
- `dist/write` and `dist/__writer` do not exist after a build.
- A `draft: true` entry produces no `dist/blog/<slug>` in a production build and does render in dev.
- The writer round trip: create an entry in `/write`, see it in the preview, edit it, reload, the fields come back as saved. Publish on a throwaway branch produces one commit with one file.
- Screenshots of `/blog`, an entry, a tag page, the home section and `/write` go through `design-critique` before the work is called done. Score and round count go in the summary.
- Contrast on paper checked for body links and inline code.

## Risks

- Whether the Astro dev server re-runs `getStaticPaths` for `/blog/[...slug]` when a new content file appears. If it does not, a brand new entry previews as 404 until a restart. Checked first in implementation; the fallback is a preview route owned by the writer that reads the entry by slug on request.
- A tall paper block on `/blog` once the log is long. The soundings and marginalia print across the whole surface; if that reads as noise past a few screens, the marks get a cap.
- Long titles in the display voice. The `--entry` size is the fix; if a 12 word title still wraps to four lines, the size goes down again, not the voice.
