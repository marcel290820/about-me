import type { AstroIntegration } from 'astro';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { access, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SLUG_RE } from './slug.ts';
import { commitMessage, parseEntry, serializeEntry, validateFrontmatter, type Entry } from './entry.ts';

/*
 * The chart table. Dev only: the route and the API below exist while
 * `astro dev` runs and nowhere else. Nothing here is reachable from a build.
 *
 * Contract: takes the project root from Astro, reads and writes files under
 * src/content/blog, runs git in the project root on publish. Fails with a
 * JSON error and a status; never swallows one.
 */

const API = '/__writer/';
const CONTENT_DIR = 'src/content/blog';
const EXTS = ['md', 'mdx'] as const;
type Ext = (typeof EXTS)[number];

const run = promisify(execFile);

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface Paths {
  root: string;
  dir: string;
}

export default function writer(): AstroIntegration {
  let paths: Paths;
  return {
    name: 'writer',
    hooks: {
      'astro:config:setup': ({ command, config, injectRoute }) => {
        const root = fileURLToPath(config.root);
        paths = { root, dir: path.join(root, CONTENT_DIR) };
        if (command !== 'dev') return;
        injectRoute({ pattern: '/write', entrypoint: new URL('./src/writer/write.astro', config.root) });
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith(API)) return next();
          try {
            const url = new URL(req.url, 'http://localhost');
            const body = await readJson(req);
            const result = await handle(req.method ?? 'GET', url, body, paths);
            send(res, 200, result);
          } catch (err) {
            const status = err instanceof HttpError ? err.status : 500;
            send(res, status, { error: err instanceof Error ? err.message : String(err) });
          }
        });
      },
    },
  };
}

async function handle(method: string, url: URL, body: unknown, paths: Paths): Promise<unknown> {
  const route = url.pathname.slice(API.length);
  if (method === 'GET' && route === 'entries') return listEntries(paths.dir);
  if (method === 'GET' && route === 'entry') return loadEntry(paths.dir, url.searchParams.get('slug'));
  if (method === 'PUT' && route === 'entry') return saveEntry(paths.dir, body);
  if (method === 'POST' && route === 'publish') return publish(paths, body);
  throw new HttpError(404, `no such route: ${method} ${url.pathname}`);
}

// --- files ------------------------------------------------------------------

function checkSlug(slug: unknown): string {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) {
    throw new HttpError(400, 'slug must be lowercase words joined by single hyphens');
  }
  return slug;
}

function checkExt(ext: unknown): Ext {
  if (ext === undefined) return 'md';
  if (typeof ext === 'string' && (EXTS as readonly string[]).includes(ext)) return ext as Ext;
  throw new HttpError(400, `ext must be one of ${EXTS.join(', ')}`);
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

/** Find which extension an existing slug uses, or null. */
async function findExt(dir: string, slug: string): Promise<Ext | null> {
  for (const ext of EXTS) {
    if (await exists(path.join(dir, `${slug}.${ext}`))) return ext;
  }
  return null;
}

async function listEntries(dir: string) {
  const names = (await exists(dir)) ? await readdir(dir) : [];
  const entries = [];
  for (const name of names) {
    const match = /^(.+)\.(md|mdx)$/.exec(name);
    if (!match) continue;
    const [, slug, ext] = match;
    let entry: Entry;
    try {
      entry = parseEntry(await readFile(path.join(dir, name), 'utf8'));
    } catch (err) {
      throw new HttpError(500, `${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
    entries.push({
      slug,
      ext,
      title: entry.frontmatter.title,
      pubDate: entry.frontmatter.pubDate,
      draft: entry.frontmatter.draft,
    });
  }
  return entries.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
}

async function loadEntry(dir: string, slugParam: string | null) {
  const slug = checkSlug(slugParam);
  const ext = await findExt(dir, slug);
  if (!ext) throw new HttpError(404, `no entry named ${slug}`);
  const entry = parseEntry(await readFile(path.join(dir, `${slug}.${ext}`), 'utf8'));
  return { slug, ext, ...entry };
}

async function writeEntry(dir: string, slug: string, ext: Ext, entry: Entry): Promise<string> {
  const file = path.join(dir, `${slug}.${ext}`);
  // Temp file then rename, so a crash mid-write never leaves half an entry.
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, serializeEntry(entry), 'utf8');
  await rename(tmp, file);
  return file;
}

async function saveEntry(dir: string, body: unknown) {
  const input = (body ?? {}) as Record<string, unknown>;
  const slug = checkSlug(input.slug);
  const ext = checkExt(input.ext);
  const frontmatter = (() => {
    try {
      return validateFrontmatter(input.frontmatter);
    } catch (err) {
      throw new HttpError(400, err instanceof Error ? err.message : String(err));
    }
  })();
  if (typeof input.body !== 'string') throw new HttpError(400, 'body must be text');

  const current = await findExt(dir, slug);
  if (input.create && current) throw new HttpError(409, `an entry named ${slug} already exists`);
  if (!input.create && !current) throw new HttpError(404, `no entry named ${slug}`);

  await writeEntry(dir, slug, current ?? ext, { frontmatter, body: input.body });
  return { ok: true };
}

// --- publish ----------------------------------------------------------------

async function git(root: string, args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await run('git', args, { cwd: root });
    return `${stdout}${stderr}`;
  } catch (err) {
    const e = err as { stderr?: string; message: string };
    throw new HttpError(500, `git ${args[0]}: ${(e.stderr || e.message).trim()}`);
  }
}

async function publish(paths: Paths, body: unknown) {
  const slug = checkSlug(((body ?? {}) as Record<string, unknown>).slug);
  const ext = await findExt(paths.dir, slug);
  if (!ext) throw new HttpError(404, `no entry named ${slug}`);

  const staged = (await git(paths.root, ['diff', '--cached', '--name-only'])).trim();
  if (staged) throw new HttpError(409, `other changes are already staged:\n${staged}`);

  const file = path.join(paths.dir, `${slug}.${ext}`);
  const entry = parseEntry(await readFile(file, 'utf8'));
  entry.frontmatter.draft = false;
  await writeEntry(paths.dir, slug, ext, entry);

  const rel = path.relative(paths.root, file);
  let output = '';
  output += await git(paths.root, ['add', '--', rel]);
  output += await git(paths.root, ['commit', '-m', commitMessage(entry.frontmatter.title), '--', rel]);
  output += await git(paths.root, ['push']);
  return { ok: true, output };
}

// --- http -------------------------------------------------------------------

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'body is not JSON');
  }
}

function send(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}
