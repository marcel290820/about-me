// Checks the production artifact; run npm run check to build it first.
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

const output = new URL('../dist/', import.meta.url);

test('the personal site ships one page, local assets, and working legacy redirects', async () => {
  const home = await readFile(new URL('index.html', output), 'utf8');
  const files = await readdir(output, { recursive: true });
  const domain = (await readFile(new URL('../public/CNAME', import.meta.url), 'utf8')).trim();
  const canonical = home.match(/<link rel="canonical" href="([^"]+)"/);

  assert.ok(canonical, 'The homepage needs a canonical URL');
  assert.equal(canonical[1], `https://${domain}/`);
  assert.match(home, /<html lang="en"/);
  assert.equal([...home.matchAll(/<h1[\s>]/g)].length, 1);
  assert.doesNotMatch(home, /<script\b|<iframe\b|<canvas\b|<link[^>]+rel="(?:preconnect|alternate)"/i);
  assert.equal(files.some(file => /\.(?:m?js|woff2?)$/.test(file)), false);

  const links = [...home.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(links.length, 9);
  assert.equal(links.filter(link => link.startsWith('mailto:')).length, 1);
  assert.deepEqual(links.slice(0, 5), [
    'https://sourcepark.de/',
    'https://www.campana-schott.com/de/de/',
    'https://www.capgemini.com/',
    'https://cct-ev.de/',
    'https://www.juniter.de/',
  ]);
  assert.deepEqual(links.slice(5).filter(link => link.startsWith('https:')).map(link => new URL(link).hostname), [
    'oceancollege.eu',
    'github.com',
    'www.linkedin.com',
  ]);
  assert.match(home.replace(/\s+/g, ' '), /Ghostty, zsh and tmux, with pi as my coding agent\./);
  assert.doesNotMatch(home, /<a\b[^>]*>[^<]*(?:Ghostty|zsh|tmux|\bpi\b)/);

  const images = [...home.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(match => match[1]);
  const portrait = home.match(/<img\b[^>]*>/)?.[0];
  const candidates = portrait?.match(/srcset="([^"]+)"/)?.[1].split(',').map(candidate => candidate.trim().split(/\s+/));
  assert.ok(candidates, 'The portrait needs high-density image sources');
  assert.deepEqual(candidates.map(([, density]) => density), ['1x', '2x', '3x']);
  assert.match(portrait, /width="120"/);
  assert.match(portrait, /height="135"/);
  const styles = [...home.matchAll(/<link\b[^>]*href="([^"]+\.css)"/g)].map(match => match[1]);
  const social = home.match(/<meta property="og:image" content="([^"]+)"/);
  assert.equal(images.length, 1);
  assert.ok(social, 'Sharing previews need an image');
  assert.equal(new URL(social[1]).hostname, domain);
  for (const asset of [...images, ...candidates.map(([src]) => src), ...styles, '/favicon.svg', new URL(social[1]).pathname]) {
    assert.match(asset, /^\/(?!\/)/, 'Assets must be served locally');
    await access(new URL(`.${asset}`, output));
  }

  const redirects = ['about', 'blog', 'projects', 'search'];
  assert.deepEqual(files.filter(file => file.endsWith('.html')).sort(), [
    '404.html',
    'index.html',
    ...redirects.map(route => `${route}/index.html`),
  ].sort());
  for (const route of redirects) {
    const html = await readFile(new URL(`${route}/index.html`, output), 'utf8');
    assert.match(html, /http-equiv="refresh"/);
    assert.match(html, /content="0;url=\/"/);
    assert.match(html, /<a href="\/">/);
  }

  const sitemap = await readFile(new URL('sitemap-0.xml', output), 'utf8');
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), [canonical[1]]);
  const missing = await readFile(new URL('404.html', output), 'utf8');
  assert.match(missing, /name="robots" content="noindex, follow"/);
  assert.match(missing, /<a href="\/">/);
  assert.equal(files.some(file => /(?:^|\/)(?:pagefind|rss\.xml|__writer|write)(?:\/|$)/.test(file)), false);
});
