// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://marcel-heidebrecht.de',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    mdx({
      shikiConfig: {
        theme: 'dracula',
        wrap: true,
      },
    }),
    sitemap(),
    pagefind(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'dracula',
      wrap: true,
    },
  },
});
