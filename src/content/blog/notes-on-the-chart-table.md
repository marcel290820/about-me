---
title: "Notes on the chart table"
description: "What the writer desk does, and what it leaves alone."
pubDate: "2026-09-06"
place: "Berlin"
tags: [site, astro]
draft: true
---

This entry exists so the log has something to print while the pages are being drawn. It is a draft, so it never reaches the built site. Delete it, or write over it.

## What the desk does

The desk is one page, `/write`, and it only exists under `npm run dev`. It saves what you type 800ms after you stop typing, and the preview on the right is the real entry page, reloaded by the dev server.

- Fields on the left, the way the soundings tables read elsewhere on the site.
- The slug fills itself from the title until the first save, then locks.
- Publish flips the draft flag, commits the file and pushes it.

Code blocks keep the Dracula theme and read as dark insets on the paper:

```sh
npm run dev
open http://localhost:4321/write
```

Inline code like `draft: false` is ink on the tint, not accent, because the accent fails contrast on paper at this size. A [link to the log](/blog) is ink with an accent underline for the same reason.

### What it leaves alone

Images, renaming, deleting, scheduling. Drop an image in `public/` and write the path.
