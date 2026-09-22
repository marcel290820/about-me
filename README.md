# About site

A small personal website about software and life by the water. One page, system
fonts, a static waterline, and direct contact links.

Built with Astro and plain CSS. It serves no browser JavaScript and makes no
third-party font or API requests.

## Work locally

Use Node 24 from `.nvmrc`, then install with `npm ci`.

- `npm run dev`: start the local site at `http://localhost:4321`.
- `npm run check`: build the site and verify the generated pages and assets.
- `npm run preview`: serve the production build locally.
- `npm test`: check an existing build in `dist/`.

The check follows the repository's existing build-and-tests convention; there
is no separate lint or typecheck toolchain.

## Files

- `src/pages/index.astro`: the page copy and layout.
- `src/styles/global.css`: colors, typography, and responsive layout.
- `src/layouts/Base.astro`: document metadata and the optimized sharing image.
- `src/pages/404.astro`: a route back home for missing pages.
- `astro.config.mjs`: site URL, sitemap, and redirects from old top-level routes.

The portrait is optimized during the build. Contact links use the existing
public profiles.

## Deployment

The existing GitHub Pages workflow installs from the lockfile, runs
`npm run check`, and deploys that build on pushes to `master`.
It does not currently run on pull requests. The custom domain stays in
`public/CNAME`; there is no manual deploy step.
