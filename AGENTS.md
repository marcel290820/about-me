# Project guidance

## Design

This is a one-page personal site. The accepted direction is Command line coast:
a narrow column, Barlow headline, plain prose, small portrait, and one
static waterline above a faintly cooler background.

Keep the copy personal and matter-of-fact. The site has no blog, project gallery,
technology inventory, employment timeline, animated ocean, or terminal
simulation. Do not reintroduce those systems without a new request.

All styling is plain CSS in `src/styles/global.css`. Use its semantic color and
font choices. Barlow is self-hosted; there are no external font requests, client
scripts, live API calls, or framework islands.

## Commands

- Use Node 24 from `.nvmrc` and `npm ci`.
- `npm run dev` serves the site at `localhost:4321`.
- `npm run check` builds and verifies the generated output.
- `npm test` checks the existing build; run the full check after source changes.
- `npm run preview` serves the production build.

The existing `.codex/check.sh` delegates to `npm run check` for local hooks.
CI runs the same command. This repository uses build and output checks rather
than a separate lint or typecheck toolchain.

## Structure

`src/pages/index.astro` owns the content. `src/layouts/Base.astro` owns document
metadata and the sharing image. Astro optimizes the portrait during the build.
`src/pages/404.astro` gives unknown URLs a route home.

Astro's static redirects preserve `/about`, `/projects`, `/blog`, and `/search`.
They are HTML meta-refresh redirects on GitHub Pages, not server-side 301s.
The sitemap lists the homepage only.

## Delivery and verification

Check the built site at desktop and mobile widths. Verify keyboard focus, text
contrast, images, old-route redirects, and that the page works with JavaScript
disabled. Use headless browser checks. Apply design-critique before reporting a
UI change complete; preserve the accepted visual direction.

The GitHub Pages workflow deploys on pushes to `master` after the check passes.
It does not currently run on pull requests. Never deploy manually.

Do not keep unused old systems in the active tree for recovery; Git history
already provides that.

Commit and push only when asked. Use conventional commits without personal
names or tool attribution.
