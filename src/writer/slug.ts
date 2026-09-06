/** The filename rule. It is also what keeps a path inside the content dir. */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
