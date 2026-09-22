// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://marcel-heidebrecht.de',
  integrations: [sitemap()],
  redirects: {
    '/about': '/',
    '/projects': '/',
    '/blog': '/',
    '/search': '/',
  },
});
