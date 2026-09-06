import yaml from 'js-yaml';

export interface Frontmatter {
  title: string;
  description: string;
  /** YYYY-MM-DD */
  pubDate: string;
  updatedDate?: string;
  place?: string;
  tags: string[];
  draft: boolean;
}

export interface Entry {
  frontmatter: Frontmatter;
  body: string;
}

const BLOCK_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Split a file into frontmatter and body. Throws on a missing block or
 *  invalid fields; the writer is the only thing that writes these files,
 *  but the owner may hand-edit them, so the YAML is parsed for real. */
export function parseEntry(source: string): Entry {
  const match = BLOCK_RE.exec(source);
  if (!match) throw new Error('no frontmatter block (--- ... ---) at the top of the file');
  // JSON_SCHEMA leaves an unquoted date as the string it was typed as.
  const raw = yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
  // The blank line that separates the block from the body is not body.
  return { frontmatter: validateFrontmatter(raw), body: match[2].replace(/^(\r?\n)+/, '') };
}

export function serializeEntry({ frontmatter, body }: Entry): string {
  const fm: Record<string, unknown> = {
    title: frontmatter.title,
    description: frontmatter.description,
    pubDate: frontmatter.pubDate,
  };
  if (frontmatter.updatedDate) fm.updatedDate = frontmatter.updatedDate;
  if (frontmatter.place) fm.place = frontmatter.place;
  fm.tags = frontmatter.tags;
  fm.draft = frontmatter.draft;
  // flowLevel 1 prints tags as [a, b]; lineWidth -1 never folds a long line.
  const head = yaml.dump(fm, { flowLevel: 1, lineWidth: -1 });
  return `---\n${head}---\n\n${body.replace(/\s+$/, '')}\n`;
}

/** Check a parsed frontmatter object and fill the two defaults. */
export function validateFrontmatter(input: unknown): Frontmatter {
  const problems: string[] = [];
  const fm = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  if (!input || typeof input !== 'object') problems.push('frontmatter is not a map');

  const text = (key: string, required: boolean): string | undefined => {
    const value = fm[key];
    if (value === undefined || value === null || value === '') {
      if (required) problems.push(`${key} is required`);
      return undefined;
    }
    if (typeof value !== 'string') {
      problems.push(`${key} must be text`);
      return undefined;
    }
    return value;
  };
  const date = (key: string, required: boolean): string | undefined => {
    const value = text(key, required);
    if (value !== undefined && !DATE_RE.test(value)) problems.push(`${key} must be YYYY-MM-DD`);
    return value;
  };

  const title = text('title', true);
  const description = text('description', true);
  const pubDate = date('pubDate', true);
  const updatedDate = date('updatedDate', false);
  const place = text('place', false);

  let tags: string[] = [];
  if (fm.tags !== undefined && fm.tags !== null) {
    if (Array.isArray(fm.tags) && fm.tags.every((t) => typeof t === 'string' && t.trim() !== '')) {
      tags = fm.tags.map((t: string) => t.trim());
    } else {
      problems.push('tags must be a list of words');
    }
  }

  let draft = false;
  if (fm.draft !== undefined && fm.draft !== null) {
    if (typeof fm.draft === 'boolean') draft = fm.draft;
    else problems.push('draft must be true or false');
  }

  if (problems.length > 0) throw new Error(problems.join('; '));

  const out: Frontmatter = {
    title: title!,
    description: description!,
    pubDate: pubDate!,
    tags,
    draft,
  };
  if (updatedDate) out.updatedDate = updatedDate;
  if (place) out.place = place;
  return out;
}

/** One line, whitespace collapsed, so it is a legal subject. */
export function commitMessage(title: string): string {
  return `post: ${title.replace(/\s+/g, ' ').trim()}`;
}
