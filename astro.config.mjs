// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import writer from './src/writer/integration.ts';

export default defineConfig({
  site: 'https://marcel-heidebrecht.de',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    mdx({
      shikiConfig: {
        theme: 'css-variables',
        wrap: true,
      },
    }),
    // `/blog` still builds with the log off (see SHOW_BLOG in src/lib/log.ts);
    // keep the orphan out of the sitemap until it carries entries again.
    sitemap({ filter: (page) => !page.includes('/blog') }),
    pagefind(),
    writer(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
      wrap: true,
    },
  },
});
