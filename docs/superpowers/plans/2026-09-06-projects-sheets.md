# Projects: chart sheets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unused project card grid with one chart sheet per project, add the first entry, and print the newest sheet on home.

**Architecture:** A yaml collection with a strict schema; a pure geometry function in `src/lib/sheet.ts` that places the fix and the marks and is proven collision-free by a `node --test` check; one `Sheet.astro` component that turns that geometry into an SVG plate inside the existing `.portrait-inset` frame with an HTML title block; `/projects` and home render it. CSS lives in `src/styles/global.css` under `@layer components`.

**Tech Stack:** Astro 6.1.9, Tailwind v4 (`@tailwindcss/vite`), Zod via `astro/zod`, Node 22.15 (`--experimental-strip-types` for the test), Playwright MCP for screenshots.

**Spec:** `docs/superpowers/specs/2026-09-06-projects-sheets-design.md`

**Status:** executed inline on 2026-09-06. One addition landed during execution, at the owner's request: every stack name prints as its logo (`src/lib/logos.ts`, Simple Icons and Devicon, the anchor drawn by hand), so the marks in Task 2 and 3 grew an `icon` and the split became three top, five right. The spec carries the final geometry; where this plan and the spec differ, the spec is right.

## Global Constraints

- No brand names and no company names anywhere in the section. Entries are described by what they do, never who they were for.
- ASCII only in every file and every line of copy: hyphen, straight quotes, three periods. No em dashes, no curly quotes.
- No personal names and no Claude or session attribution in commits, comments or generated files.
- Do not commit unless the owner asks. Each task ends on a green `npm run build` (and `npm test` from Task 2 on). If the owner asks for per-task commits, use the message given in the task's last step.
- All custom CSS goes in `src/styles/global.css` inside `@layer components`. Semantic tokens only (`--color-text`, `--color-surface`, `--color-border-bright`, `--color-accent`), never the fixed anchors. Border radius 2px, no glow shadows.
- Tailwind v4 syntax. Utilities inline for layout and spacing; component classes for the plate's own lettering and motion.
- Paper does not move. Every animation survives `prefers-reduced-motion` by arming only when the page can animate.
- Schema caps: `title` max 48 characters, `stack` 3 to 8 names, each name max 16 characters. The geometry check assumes these caps.
- The plate viewBox is `0 0 640 300`. Top marks spread across x 80 to 560, right marks across y 50 to 250, the fix in x 380 to 430 and y 115 to 150. Changing any of these means rerunning `npm test`.
- Run every command from the worktree root: `/Users/mheidebrecht/Documents/Projects/Personal/about-me/.claude/worktrees/projects-section`.

---

## File structure

| File | Responsibility |
|---|---|
| `src/content.config.ts` (modify) | The `projects` schema: yaml loader, the fields and their caps. |
| `src/content/projects/prediction-markets.yaml` (create) | The first entry. |
| `src/lib/sheet.ts` (create) | Pure geometry: fix position from a title hash, mark slots on the frame, where each name prints. No Astro, no DOM. |
| `src/lib/sheet.test.ts` (create) | The runnable check: at the schema's caps no name leaves the frame, touches another or covers the title block. |
| `src/lib/projects.ts` (create) | `newestFirst`, the one sort order, used by both pages. |
| `package.json`, `.claude/check.sh`, `.github/workflows/deploy.yml` (modify) | `npm test` exists and runs locally and in CI before the build. |
| `src/components/Sheet.astro` (create) | One sheet: the SVG plate, the HTML title block, the text under it, the draw-on script. |
| `src/styles/global.css` (modify) | `.sheet` lettering, the fix animation, the phone rule. |
| `src/pages/projects.astro` (rewrite) | Title block on the paper, sheets in the water. |
| `src/pages/index.astro` (modify) | The "projects" section prints the newest sheet. |
| `src/components/ProjectCard.astro` (delete) | Replaced. |
| `CLAUDE.md`, `PLACEHOLDERS.md` (modify) | Collections, styling notes, the commands line, the placeholder table. |

---

### Task 1: Schema and the first entry

**Files:**
- Modify: `src/content.config.ts:18-31`
- Create: `src/content/projects/prediction-markets.yaml`

**Interfaces:**
- Produces: `CollectionEntry<'projects'>['data']` with fields `title: string`, `domain: 'web3' | 'web' | 'infra' | 'data' | 'mobile'`, `description: string`, `stack: string[]`, `from: number`, `to?: number`, `url?: string`, `repo?: string`. Tasks 2 to 4 rely on exactly these names.

- [ ] **Step 1: Confirm the build warns today**

Run: `npm run build 2>&1 | grep -i "projects"`
Expected: a warning that `src/content/projects` does not exist (the directory is missing; `PLACEHOLDERS.md` records this).

- [ ] **Step 2: Replace the projects collection in `src/content.config.ts`**

Replace the whole `const projects = defineCollection({ ... });` block (currently lines 18 to 31) with:

```ts
const projects = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/projects' }),
  schema: z.object({
    // Named by what it does, never a brand. Longer than this wraps the
    // sheet's title block to a third line.
    title: z.string().max(48),
    domain: z.enum(['web3', 'web', 'infra', 'data', 'mobile']),
    description: z.string(),
    // Each name is a mark on the sheet's frame. Longer than sixteen
    // characters and it no longer fits its slot; see src/lib/sheet.ts.
    stack: z.array(z.string().max(16)).min(3).max(8),
    from: z.number().int(),
    to: z.number().int().optional(),
    url: z.string().optional(),
    repo: z.string().optional(),
  }),
});
```

Leave `blog` and `interests` untouched.

- [ ] **Step 3: Create the entry**

Create `src/content/projects/prediction-markets.yaml`:

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

- [ ] **Step 4: Build and check the entry is read**

Run: `npm run build 2>&1 | grep -ci "warn"`
Expected: `0`.

Run: `grep -c "Prediction markets on Solana" dist/projects/index.html`
Expected: `1` or more. The old card still renders the title; the page looks wrong until Task 3 and that is fine.

- [ ] **Step 5: Commit, only if the owner has asked for commits**

```bash
git add src/content.config.ts src/content/projects/prediction-markets.yaml
git commit -m "feat: projects schema as yaml sheets and the first entry"
```

---

### Task 2: Sheet geometry with its check

**Files:**
- Create: `src/lib/sheet.ts`
- Create: `src/lib/sheet.test.ts`
- Create: `src/lib/projects.ts`
- Modify: `package.json` (scripts)
- Modify: `.claude/check.sh`
- Modify: `.github/workflows/deploy.yml:30-34`

**Interfaces:**
- Produces: `layout(title: string, stack: string[]): { fix: { x: number; y: number }; marks: Mark[] }` where `Mark = { name: string; edge: 'top' | 'right'; x: number; y: number; tx: number; ty: number; anchor: 'start' | 'end' }`. `x, y` is where the tick meets the frame; `tx, ty` is the name's anchor point. Constants `W = 640`, `H = 300`, `TICK = 6` are exported. Task 3 consumes all of these.
- Produces: `newestFirst(a, b)` comparator over `CollectionEntry<'projects'>`. Tasks 3 and 4 consume it.

- [ ] **Step 1: Write the failing check**

Create `src/lib/sheet.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { H, W, layout, type Mark } from './sheet.ts';

// A name prints at 11 units in the plate's mono face with 0.04em tracking:
// about 7.04 units a character, 11 tall, run from its anchor.
const box = (m: Mark) => {
  const w = m.name.length * 7.04;
  const x0 = m.anchor === 'end' ? m.tx - w : m.tx;
  return { x0, x1: x0 + w, y0: m.ty - 11, y1: m.ty };
};
type Box = ReturnType<typeof box>;
const apart = (a: Box, b: Box) => a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0;

// The widest names the schema allows: sixteen characters each.
const WORST = Array.from({ length: 8 }, (_, i) => String.fromCharCode(65 + i).repeat(16));
// The title block covers the bottom-left corner, up to 60% wide and, at the
// narrowest width that still prints names, about 50 units tall.
const BLOCK: Box = { x0: 0, x1: W * 0.6, y0: H - 50, y1: H };

test('eight names split four top, four right', () => {
  const { marks } = layout('Prediction markets on Solana', WORST);
  assert.equal(marks.filter((m) => m.edge === 'top').length, 4);
  assert.equal(marks.filter((m) => m.edge === 'right').length, 4);
});

test('no name leaves the frame, touches another, or covers the title block', () => {
  for (const n of [3, 4, 5, 6, 7, 8]) {
    // Two titles that put the fix at different ends of its range would be
    // ideal; a spread of titles is the cheap version of that.
    for (const title of ['a', 'Prediction markets on Solana', 'zz top', 'Observability for a platform']) {
      const boxes = layout(title, WORST.slice(0, n)).marks.map(box);
      for (const [i, a] of boxes.entries()) {
        assert.ok(a.x0 >= 0 && a.x1 <= W && a.y0 >= 0 && a.y1 <= H, `name ${i} of ${n} leaves the frame (${title})`);
        assert.ok(apart(a, BLOCK), `name ${i} of ${n} covers the title block (${title})`);
        for (const b of boxes.slice(i + 1)) assert.ok(apart(a, b), `names collide at ${n} (${title})`);
      }
    }
  }
});

test('the fix is deterministic and inside its range', () => {
  const a = layout('Prediction markets on Solana', WORST).fix;
  assert.deepEqual(layout('Prediction markets on Solana', WORST).fix, a);
  assert.ok(a.x >= 380 && a.x <= 430, `fix x ${a.x}`);
  assert.ok(a.y >= 115 && a.y <= 150, `fix y ${a.y}`);
});
```

- [ ] **Step 2: Add the test script and run it to see it fail**

In `package.json`, add to `"scripts"` after `"preview"`:

```json
    "test": "node --experimental-strip-types --test src/lib/sheet.test.ts",
```

Run: `npm test`
Expected: FAIL, `Cannot find module` for `./sheet.ts`.

- [ ] **Step 3: Write the geometry**

Create `src/lib/sheet.ts`:

```ts
// The geometry of a chart sheet: where the fix sits and where each mark on
// the frame prints, in the plate's viewBox units. Pure, so sheet.test.ts can
// prove the collision rules without a browser. Change a range or the name
// size here and rerun `npm test`.
export const W = 640;
export const H = 300;
export const TICK = 6;

// Where marks may sit. Four top slots are 120 units apart, which clears a
// sixteen-character name (113 units) printing on either side of its tick,
// and the outer slots keep such a name inside the frame. The right range
// keeps the lowest name clear of the title block.
const TOP: [number, number] = [80, 560];
const RIGHT: [number, number] = [50, 250];
// The fix sits right of centre and above the middle, and never in the same
// place on two sheets: both coordinates come from a hash of the title.
const FIX_X: [number, number] = [380, 430];
const FIX_Y: [number, number] = [115, 150];

export type Mark = {
  name: string;
  edge: 'top' | 'right';
  /** Where the tick meets the frame. */
  x: number;
  y: number;
  /** Where the name is anchored, and which way it runs from there. */
  tx: number;
  ty: number;
  anchor: 'start' | 'end';
};

// FNV-1a, 32 bit. Anything deterministic would do; this one is five lines.
const hash = (s: string, seed: number) => {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
};
const pick = ([lo, hi]: [number, number], h: number) => lo + (h % (hi - lo + 1));

// Evenly spread and centred in the range: one slot lands in the middle,
// four land at 12.5, 37.5, 62.5 and 87.5 percent.
const spread = ([lo, hi]: [number, number], n: number, i: number) => lo + ((hi - lo) * (i + 0.5)) / n;

export function layout(title: string, stack: string[]): { fix: { x: number; y: number }; marks: Mark[] } {
  const fix = { x: pick(FIX_X, hash(title, 2166136261)), y: pick(FIX_Y, hash(title, 5381)) };
  // Half the names, rounded up, take the top edge; the rest the right edge.
  // A name prints on the side of its tick away from the fix, so its own
  // bearing never crosses it.
  const nTop = Math.ceil(stack.length / 2);
  const marks = stack.map((name, i): Mark => {
    if (i < nTop) {
      const x = spread(TOP, nTop, i);
      const left = x < fix.x;
      return { name, edge: 'top', x, y: 0, tx: left ? x - 4 : x + 4, ty: 16, anchor: left ? 'end' : 'start' };
    }
    const y = spread(RIGHT, stack.length - nTop, i - nTop);
    return { name, edge: 'right', x: W, y, tx: W - 10, ty: y < fix.y ? y - 5 : y + 13, anchor: 'end' };
  });
  return { fix, marks };
}
```

- [ ] **Step 4: Run the check and see it pass**

Run: `npm test`
Expected: `# pass 3`, `# fail 0`. An `ExperimentalWarning` about type stripping is printed by Node 22.15 and is fine.

- [ ] **Step 5: Add the sort order**

Create `src/lib/projects.ts`:

```ts
import type { CollectionEntry } from 'astro:content';

type Project = CollectionEntry<'projects'>;

// Newest first: by the year the work ended, then the year it started.
export const newestFirst = (a: Project, b: Project) =>
  (b.data.to ?? b.data.from) - (a.data.to ?? a.data.from) || b.data.from - a.data.from;
```

- [ ] **Step 6: Wire the check into the gates and CI**

Replace `.claude/check.sh` with:

```sh
#!/bin/sh
# The one check: stop gate, commit gate and CI all run this. There is no
# lint or typecheck; the sheet geometry check and the build prove a change.
set -eu
cd "$(dirname "$0")/.."
npm test
npm run build
```

In `.github/workflows/deploy.yml`, between the `Install dependencies` step and the `Build site` step, add:

```yaml
      - name: Test
        run: npm test

```

so the steps read Install dependencies, Test, Build site, Pagefind index.

- [ ] **Step 7: Run the whole gate**

Run: `sh .claude/check.sh 2>&1 | grep -E "^# (pass|fail)|Complete|error" `
Expected: `# pass 3`, `# fail 0`, then the Astro `Complete!` line and no `error`.

- [ ] **Step 8: Commit, only if the owner has asked for commits**

```bash
git add src/lib/sheet.ts src/lib/sheet.test.ts src/lib/projects.ts package.json .claude/check.sh .github/workflows/deploy.yml
git commit -m "feat: sheet geometry with a collision check under npm test"
```

---

### Task 3: The sheet component and the projects page

**Files:**
- Create: `src/components/Sheet.astro`
- Modify: `src/styles/global.css` (insert before the `/* --- Waterline ---` comment, after the passage plot's `@media (width < 40rem)` block)
- Rewrite: `src/pages/projects.astro`

**Interfaces:**
- Consumes: `layout`, `W`, `H`, `TICK`, `Mark` from `@/lib/sheet`; `newestFirst` from `@/lib/projects`; the schema fields from Task 1.
- Produces: `<Sheet project={entry.data} />`. Task 4 consumes it on home.

- [ ] **Step 1: Write the component**

Create `src/components/Sheet.astro`:

```astro
---
// One chart sheet per project. The stack is the set of marks: every name is
// a tick on the top or right edge of the frame with a bearing run in to the
// fix, and the fix is the project. Marks sit on the frame rather than at the
// ends of floating lines because edge slots cannot collide, and line ends
// did. The geometry is in src/lib/sheet.ts, where its check lives.
import type { CollectionEntry } from 'astro:content';
import { H, TICK, W, layout, type Mark } from '@/lib/sheet';

interface Props {
  project: CollectionEntry<'projects'>['data'];
}

const { project: p } = Astro.props;
const { fix, marks } = layout(p.title, p.stack);

const tick = (m: Mark) =>
  m.edge === 'top' ? `M${m.x.toFixed(1)} 0v${TICK}` : `M${W} ${m.y.toFixed(1)}h-${TICK}`;
const bearing = (m: Mark) =>
  m.edge === 'top'
    ? `M${m.x.toFixed(1)} ${TICK}L${fix.x} ${fix.y}`
    : `M${W - TICK} ${m.y.toFixed(1)}L${fix.x} ${fix.y}`;

const years = p.to && p.to !== p.from ? `${p.from} to ${p.to}` : `${p.from}`;
const link =
  'font-mono text-[0.625rem] uppercase tracking-[0.14em] text-text-muted hover:text-accent transition-colors';
---

<article class="sheet" data-sheet style={`--n:${marks.length - 1}`}>
  <figure class="portrait-inset w-full">
    <div class="portrait-inset__frame">
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" fill="none" stroke="currentColor">
        {/* Graticule. */}
        <g stroke-width="0.5" opacity="0.22">
          <path d={`M${W / 4} 0V${H}M${W / 2} 0V${H}M${(W * 3) / 4} 0V${H}`} />
          <path d={`M0 ${H / 3}H${W}M0 ${(H * 2) / 3}H${W}`} />
        </g>
        {/* The marks on the frame, and the bearings run in from them. Each
            bearing carries its index so the draw-on can stagger them. */}
        <path d={marks.map(tick).join('')} stroke-width="0.8" />
        <g stroke-width="0.6" opacity="0.7">
          {marks.map((m, i) => (
            <path d={bearing(m)} class="sheet__bearing" pathLength="1" style={`--i:${i}`} />
          ))}
        </g>
        {/* The fix: the passage plot's marker inside a dashed circle, the way
            the cocked-hat mark in the margin draws one. The surface fill is
            what stops the bearings at the ring. */}
        <g class="sheet__fix">
          <circle cx={fix.x} cy={fix.y} r="8" stroke-width="0.5" stroke-dasharray="1 3" />
          <circle cx={fix.x} cy={fix.y} r="3.5" stroke-width="1" fill="var(--color-surface)" />
        </g>
        <g class="sheet__names">
          {marks.map((m) => (
            <text x={m.tx.toFixed(1)} y={m.ty.toFixed(1)} text-anchor={m.anchor}>{m.name}</text>
          ))}
        </g>
      </svg>
      {/* The title block is HTML so it wraps instead of truncating and holds
          its size on a phone. It sits over the plate's bottom-left corner,
          which no bearing reaches: every mark is on the top or right edge
          and the fix is in the upper right. */}
      <div class="absolute left-[5px] bottom-[5px] max-w-[60%] flex flex-col gap-1 px-3 py-2 border border-border-bright bg-surface">
        <span class="label text-[0.8125rem] leading-tight text-text">{p.title}</span>
        <span class="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-accent">{p.domain} &middot; {years}</span>
      </div>
    </div>
  </figure>

  <p class="mt-4 text-[0.9375rem] text-text-muted">{p.description}</p>
  {/* Under sm the plate is a third the size it was drawn at and the names in
      it go; this line carries the stack there. Above sm it is for screen
      readers only, since the plate is hidden from them. */}
  <p class="mt-2 font-mono text-xs text-text-dim sm:sr-only">
    {p.stack.map((s, i) => (
      <Fragment>{i > 0 && <span class="text-text-faint"> &middot; </span>}{s}</Fragment>
    ))}
  </p>
  {(p.url || p.repo) && (
    <div class="flex items-center gap-5 mt-3">
      {p.url && (
        <a href={p.url} target="_blank" rel="noopener noreferrer" class={link}>live &rarr;</a>
      )}
      {p.repo && (
        <a href={p.repo} target="_blank" rel="noopener noreferrer" class={link}>source &rarr;</a>
      )}
    </div>
  )}
</article>

<script>
  // Armed only when the page can animate: the arming is what hides the
  // bearings and the fix, so a visitor with no script or with reduced motion
  // gets the finished sheet. Copied from Passage.astro on purpose; two
  // copies of twenty lines cost less than an abstraction over two callers.
  const sheets = document.querySelectorAll<HTMLElement>('[data-sheet]');
  if (sheets.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const seen = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-seen');
          seen.unobserve(e.target);
        }
      },
      { threshold: 0.35 },
    );
    for (const el of sheets) {
      el.classList.add('is-armed');
      seen.observe(el);
      // Once the fix is up the drawn sheet is the resting state again, so a
      // cancelled animation later cannot run it again from nothing. The fix
      // is the last thing to land, so it is the one to wait for.
      const settle = (e: AnimationEvent) => {
        if (e.animationName !== 'sheet-fix') return;
        el.classList.remove('is-armed');
        el.removeEventListener('animationend', settle);
      };
      el.addEventListener('animationend', settle);
    }
  }
</script>
```

- [ ] **Step 2: Add the CSS**

In `src/styles/global.css`, find the passage plot's closing phone rule (it ends with `.passage__names text { font-size: 17px; } }`) and the `/* --- Waterline ---` comment that follows it. Insert between them:

```css
  /* --- Chart sheets ------------------------------------------------------
     One plate per project. The frame, its corner ticks and the title block
     come from the portrait inset and utilities; this is the plate's own
     lettering, and the fix being taken when the sheet scrolls into view.
     The geometry that keeps names apart is in src/lib/sheet.ts. */

  .sheet svg {
    display: block;
    width: 100%;
    height: auto;
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }

  .sheet__names text {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    fill: var(--color-text-muted);
    /* The passage's knockout: a name crossing a graticule line sits over it
       instead of tangling with it. sheet.test.ts sizes names at 7.04 units
       a character from this font size and tracking. */
    paint-order: stroke;
    stroke: var(--color-surface);
    stroke-width: 3px;
    stroke-linejoin: round;
  }

  /* Taking the fix. Arming hides the bearings and the fix; seeing draws each
     bearing in from its mark, staggered by --i, and the fix comes up once
     the last bearing (--n) has landed. */
  .sheet__bearing {
    stroke-dasharray: 1;
    stroke-dashoffset: 0;
  }

  .sheet.is-armed .sheet__bearing {
    stroke-dashoffset: 1;
  }

  .sheet.is-armed .sheet__fix {
    opacity: 0;
  }

  .sheet.is-seen .sheet__bearing {
    animation: sheet-draw 0.9s ease-in-out forwards;
    animation-delay: calc(var(--i, 0) * 90ms);
  }

  .sheet.is-seen .sheet__fix {
    animation: sheet-fix 0.5s ease-out forwards;
    animation-delay: calc(0.9s + var(--n, 0) * 90ms);
  }

  @keyframes sheet-draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes sheet-fix {
    to {
      opacity: 1;
    }
  }

  /* Under 40rem the plate is a third the size it was drawn at. The names go
     and the line under the plate carries the stack. */
  @media (width < 40rem) {
    .sheet__names {
      display: none;
    }
  }

```

- [ ] **Step 3: Rewrite the projects page**

Replace the whole of `src/pages/projects.astro` with:

```astro
---
import Page from '@/layouts/Page.astro';
import Sheet from '@/components/Sheet.astro';
import { getCollection } from 'astro:content';
import { newestFirst } from '@/lib/projects';

const projects = (await getCollection('projects')).sort(newestFirst);
---

<Page title="Projects" description="Projects by Marcel Heidebrecht" surface>
  <div slot="surface" class="pt-8 pb-16 sm:pt-12 sm:pb-24">
    <h1 class="display-name mb-4">Projects</h1>
    <p class="font-mono text-xs uppercase tracking-[0.16em] text-text-dim mb-8">catalogue of sheets</p>
    <p class="text-[0.9375rem] text-text-muted max-w-prose">
      Domains and stacks, one sheet each. The stories, where there are any, are in the
      <a href="/blog" class="text-accent hover:underline">blog</a>.
    </p>
  </div>

  {/* One column, full width, newest first. No domain sections and no rules
      between sheets: the frame is the separator, and a grid of plates would
      be a grid of cards. */}
  <div class="space-y-16 sm:space-y-24">
    {projects.map((p) => <Sheet project={p.data} />)}
  </div>
</Page>
```

The `description` meta keeps the owner's name because it is the site owner's page title, not a commit or a comment.

- [ ] **Step 4: Build and check the sheet is in the output**

Run: `sh .claude/check.sh 2>&1 | grep -E "^# (pass|fail)|Complete|error|warn"`
Expected: `# pass 3`, `# fail 0`, `Complete!`, nothing else.

Run: `grep -o 'class="sheet__bearing"' dist/projects/index.html | wc -l`
Expected: `8`.

Run: `grep -c 'GitHub Actions' dist/projects/index.html`
Expected: `1` or more (the name prints in the plate and in the phone line).

Run: `grep -c 'ProjectCard\|class="tag"' dist/projects/index.html`
Expected: `0`.

- [ ] **Step 5: Look at it once**

Run in the background: `npm run preview -- --port 4399 --host 127.0.0.1`

With the Playwright MCP tools: `browser_resize` to 1280 x 900, `browser_navigate` to `http://127.0.0.1:4399/projects`, `browser_wait_for` 3 seconds so the fix has been taken, `browser_take_screenshot` with `fullPage: true` to the absolute path `<worktree>/.playwright-mcp/sheet-projects-1280.png`. Open the file with Read and confirm: four names along the top edge, four down the right, none touching each other or the title block, the title block in the bottom-left with "PREDICTION MARKETS ON SOLANA" and "web3 . 2025" in orange, the bearings drawn in to a ring. If a name touches anything, the geometry check missed it: fix the test first, then `src/lib/sheet.ts`.

Stop the preview server (TaskStop on its task id) before moving on.

- [ ] **Step 6: Commit, only if the owner has asked for commits**

```bash
git add src/components/Sheet.astro src/styles/global.css src/pages/projects.astro
git commit -m "feat: print projects as chart sheets"
```

---

### Task 4: Home, the old card, and the docs

**Files:**
- Modify: `src/pages/index.astro:1-19` (imports and the projects query) and `:47-64` (the featured projects section)
- Delete: `src/components/ProjectCard.astro`
- Modify: `CLAUDE.md:5-9` (commands), `:20` (collections), after `:34` (styling)
- Modify: `PLACEHOLDERS.md` (projects row)

**Interfaces:**
- Consumes: `<Sheet project={entry.data} />` from Task 3, `newestFirst` from Task 2.

- [ ] **Step 1: Swap the imports and the query in `src/pages/index.astro`**

Replace the line `import ProjectCard from '@/components/ProjectCard.astro';` with:

```astro
import Sheet from '@/components/Sheet.astro';
import { newestFirst } from '@/lib/projects';
```

Replace the `featuredProjects` query (the four lines from `const featuredProjects = (await getCollection('projects'))` to `.slice(0, 3);`) with:

```astro
// One sheet on home, the newest. Three would be the projects page again.
const newest = (await getCollection('projects')).sort(newestFirst)[0];
```

- [ ] **Step 2: Swap the section**

Replace the whole `{featuredProjects.length > 0 && ( <section> ... </section> )}` block with:

```astro
  {newest && (
    <section>
      <div class="section-heading">
        <h2>projects</h2>
      </div>
      <Sheet project={newest.data} />
      <a href="/projects" class="inline-block mt-6 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-text-dim hover:text-accent transition-colors">
        all projects &rarr;
      </a>
    </section>
  )}
```

- [ ] **Step 3: Delete the card and check nothing imports it**

Run: `rm src/components/ProjectCard.astro`

Run: `grep -rn "ProjectCard\|sortOrder\|featured\b" src/`
Expected: no output.

- [ ] **Step 4: Update `CLAUDE.md`**

Replace the commands line that begins `- No test, lint, or typecheck scripts exist.` with:

```markdown
- `npm test` — the sheet geometry check (`src/lib/sheet.test.ts`, `node --test`). No lint or typecheck scripts exist. Verify changes with `npm test` and `npm run build`; `.claude/check.sh` runs both for the stop and commit gates, and CI runs the same two before Pagefind.
```

Replace the collections line that begins `- Three collections:` with:

```markdown
- Three collections: `blog` (md/mdx, has `draft` field), `projects` (yaml, one file per project, no body), `interests`. Blog posts with `draft: true` are filtered out of listings.
```

After the passage plot bullet (the one beginning `- The passage plot (`Passage.astro`, class `.passage`)`) add:

```markdown
- A project is a chart sheet (`Sheet.astro`, class `.sheet`): the stack names are marks on the frame, top edge then right edge, each with a bearing run in to the fix, and the fix is the project. The geometry is in `src/lib/sheet.ts` and its test is the proof that names cannot collide at the schema's caps (sixteen characters a name, eight names); change a range or the name size there and rerun `npm test`. The title block is HTML over the plate's bottom-left corner so it wraps instead of truncating. Below `sm` the names in the plate go and a mono line under the description carries the stack; above `sm` that line is for screen readers only. Newest first, one column, no domain sections: a grid of plates is a grid of cards. No brand or company names in an entry, ever.
```

- [ ] **Step 5: Update `PLACEHOLDERS.md`**

Replace the projects row of the table with:

```markdown
| Projects | `src/content/projects/` | one sheet (prediction markets); add the rest, one yaml per project, no brands or companies |
```

- [ ] **Step 6: Build and check home**

Run: `sh .claude/check.sh 2>&1 | grep -E "^# (pass|fail)|Complete|error|warn"`
Expected: `# pass 3`, `# fail 0`, `Complete!`, nothing else.

Run: `grep -o 'class="sheet__bearing"' dist/index.html | wc -l`
Expected: `8`.

Run: `grep -c '>projects<' dist/index.html`
Expected: `1`.

- [ ] **Step 7: Commit, only if the owner has asked for commits**

```bash
git add src/pages/index.astro src/components/ProjectCard.astro CLAUDE.md PLACEHOLDERS.md
git commit -m "feat: newest sheet on home, drop the project card"
```

---

### Task 5: Screenshots and the design critique

**Files:**
- Screenshots only, under `<worktree>/.playwright-mcp/` (gitignored). Any fix lands in the files from Tasks 2 to 4.

- [ ] **Step 1: Serve the build**

Run: `npm run build` then, in the background, `npm run preview -- --port 4399 --host 127.0.0.1`.

- [ ] **Step 2: Capture six screenshots**

With the Playwright MCP tools, for each width in 390, 760, 1280 (heights 844, 1024, 900):

1. `browser_resize` to the width.
2. `browser_navigate` to `http://127.0.0.1:4399/projects`, `browser_wait_for` 3 seconds, `browser_take_screenshot` with `fullPage: true` to `<worktree>/.playwright-mcp/sheet-projects-<width>.png`.
3. `browser_navigate` to `http://127.0.0.1:4399/`, `browser_evaluate` with `() => document.querySelector('.sheet').scrollIntoView({ block: 'center' })`, `browser_wait_for` 3 seconds, `browser_take_screenshot` (viewport, not full page) to `<worktree>/.playwright-mcp/sheet-home-<width>.png`.

- [ ] **Step 3: Check the geometry by eye**

Read each file. At 760 and 1280: no name touches another name, the title block, or the frame; the bearings are drawn and the fix ring is up; the title block sits in the bottom-left over graticule only. At 390: no names in the plate, the mono stack line prints under the description, the title block wraps to two lines and stays inside the plate. Anything off is fixed in `src/lib/sheet.ts` with a matching case added to `src/lib/sheet.test.ts` first.

- [ ] **Step 4: Run the critique**

Invoke the `design-critique` skill with the six paths and this brief: "A projects page on a nautical chart site. Each project is a chart sheet: marks on the frame for the stack, bearings run in to a fix, an HTML title block bottom-left, one sentence under the plate. Hairline, unfilled, no glow, no cards, no chips. Recruiters must read domain and stack in seconds." Apply what the critique cuts or fixes, rebuild, recapture, and run it again until the score holds. Record the final score and the round count for the summary.

- [ ] **Step 5: Stop the server**

TaskStop on the preview server's task id. Confirm with `lsof -nP -iTCP:4399 -sTCP:LISTEN` printing nothing.

- [ ] **Step 6: Final gate**

Run: `sh .claude/check.sh 2>&1 | grep -E "^# (pass|fail)|Complete|error|warn"`
Expected: `# pass 3`, `# fail 0`, `Complete!`, nothing else.

Run: `git status --short`
Expected: only the files this plan names, plus nothing under `.playwright-mcp/` (it is ignored).

- [ ] **Step 7: Commit, only if the owner has asked for commits**

```bash
git add -A src docs CLAUDE.md PLACEHOLDERS.md package.json .claude/check.sh .github/workflows/deploy.yml
git commit -m "feat: chart sheets for the projects section"
```
