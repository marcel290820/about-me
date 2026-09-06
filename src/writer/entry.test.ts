import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify, SLUG_RE } from './slug.ts';
import { parseEntry, serializeEntry, validateFrontmatter, commitMessage } from './entry.ts';

test('serialize then parse round-trips', () => {
  const entry = {
    frontmatter: {
      title: 'Hello: a "quoted" title',
      description: 'One line.',
      pubDate: '2026-09-06',
      updatedDate: '2026-10-12',
      place: 'Berlin',
      tags: ['devops', 'terraform'],
      draft: true,
    },
    body: '# Heading\n\nBody with `code`.\n',
  };
  const text = serializeEntry(entry);
  assert.ok(text.startsWith('---\n'));
  assert.deepEqual(parseEntry(text), entry);
});

test('parses hand-written yaml: unquoted date, block list, missing defaults', () => {
  const text = [
    '---',
    'title: Plain title',
    'description: Plain description',
    'pubDate: 2026-09-06',
    'tags:',
    '  - a',
    '  - b',
    '---',
    '',
    'Body.',
    '',
  ].join('\n');
  const entry = parseEntry(text);
  assert.equal(entry.frontmatter.pubDate, '2026-09-06');
  assert.deepEqual(entry.frontmatter.tags, ['a', 'b']);
  assert.equal(entry.frontmatter.draft, false);
  assert.equal(entry.frontmatter.place, undefined);
  assert.equal(entry.body, 'Body.\n');
});

test('parseEntry rejects a file without a frontmatter block', () => {
  assert.throws(() => parseEntry('no block here'), /frontmatter/);
});

test('serializeEntry omits empty optionals and ends the body with one newline', () => {
  const text = serializeEntry({
    frontmatter: { title: 'T', description: 'D', pubDate: '2026-01-01', tags: [], draft: false },
    body: 'Body.\n\n\n',
  });
  assert.ok(!text.includes('place'));
  assert.ok(!text.includes('updatedDate'));
  assert.ok(text.endsWith('---\n\nBody.\n'));
});

test('validateFrontmatter names every problem', () => {
  assert.throws(
    () => validateFrontmatter({ title: '', pubDate: '6 Sep 2026', tags: 'x' }),
    (err: Error) => /title/.test(err.message) && /description/.test(err.message) && /pubDate/.test(err.message) && /tags/.test(err.message),
  );
});

test('validateFrontmatter fills defaults', () => {
  const fm = validateFrontmatter({ title: 'T', description: 'D', pubDate: '2026-01-01' });
  assert.deepEqual(fm, { title: 'T', description: 'D', pubDate: '2026-01-01', tags: [], draft: false });
});

test('slugify', () => {
  assert.equal(slugify('Hello, World!  Unicode: Uebung fuer Anfaenger'), 'hello-world-unicode-uebung-fuer-anfaenger');
  assert.equal(slugify('  --Trim me--  '), 'trim-me');
  assert.equal(slugify('Caf\u00e9 au lait'), 'cafe-au-lait');
  assert.ok(SLUG_RE.test(slugify('Any Title 2026')));
  assert.ok(!SLUG_RE.test('-leading'));
  assert.ok(!SLUG_RE.test('Upper'));
});

test('commitMessage is one line', () => {
  assert.equal(commitMessage('  A title\nwith  a break '), 'post: A title with a break');
});
