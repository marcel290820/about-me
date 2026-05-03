# marcel-heidebrecht.de

Personal portfolio and blog site for Marcel Heidebrecht — Fullstack Engineer & DevOps Enthusiast based in Berlin.

Built with [Astro](https://astro.build), styled with Tailwind CSS v4, and deployed to GitHub Pages.

## Project Structure

```text
/
├── public/              Static assets (favicon, CNAME, robots.txt)
├── src/
│   ├── assets/          Images (portrait)
│   ├── components/      Reusable UI components (Header, Footer, Hero, Cards, etc.)
│   ├── content/         Content collections (blog posts, projects, interests)
│   ├── layouts/         Page layouts (Base, Page, BlogPost)
│   ├── pages/           Route pages (index, about, blog, projects, search)
│   └── styles/          Global stylesheet (Tailwind + custom theme)
└── astro.config.mjs
```

## Commands

| Command | Action |
| :---------------- | :------------------------------------------ |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview build locally before deploying |

## Tech Stack

- **Astro** — Static site generation with content collections
- **Tailwind CSS v4** — Utility-first styling with custom theme tokens
- **MDX** — Rich blog post authoring
- **Shiki** (Dracula theme) — Code syntax highlighting
- **Pagefind** — Static search indexing
- **GitHub Pages** — Deployment via GitHub Actions
