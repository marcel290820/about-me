// Who a sheet was drawn for. Sheets print in series by this, the way a
// catalogue groups charts by the office that published them, and each
// series opens with the publisher's crest. Two are named with their own
// marks; the owner's account carries the anchor, and client work carries
// no crest at all, because the companies are not named anywhere on the
// site. The crest for CCT is a raster mask, see Series.astro.
export type Org = 'cct' | 'tub' | 'own' | 'client';

export type Publisher = {
  /** What prints in a sheet's caption and under the crest. */
  code: string;
  name: string;
  /** One line of what the series is, under the name. */
  note: string;
  url?: string;
  /** The crest, when there is one to draw: SVG children and their viewBox. */
  mark?: { viewBox: string; svg: string };
};

// The TU Berlin mark, from the logo at tu.berlin with the wordmark left
// off: the heading names the university, and at crest size the wordmark is
// mush. Printed in the site's one ink like every other logo here. The
// trademark is the university's and appears only to name it.
const TUB =
  '<path d="M75.81 80.7c6.28 0 10.79-1.86 14.29-4.21 3.27-2.19 5.8-4.78 7.74-8.12 2.51-4.32 2.78-8.33 2.99-10.66 0-.02 4.67-48.4 4.67-48.4H82.7c-.01 0-6.9 71.39-6.89 71.39z"/>' +
  '<path d="m53.86 22.73-3.45 35.8c-.58 7.83 2.36 11.85 4.18 13.97 3.34 3.87 9.47 6.91 16.56 8.18l6.6-68.51c.21-3.25-.73-6.09-2.9-8.57C72.32.71 68.57.05 67.02.05L10.46.06C6.28.06 0 4.11 0 11.11c0 8.65 7.69 11.62 10.34 11.62 1.35.01 43.52 0 43.52 0z"/>' +
  '<path d="m44.53 71.41 4.24-44.02-22.84-.05s-3.72 38.32-4.26 44.02l22.86.05z"/>';

// The site's own mark, the anchor from src/lib/logos.ts, drawn there by hand.
const ANCHOR =
  '<circle cx="12" cy="4.4" r="2.1" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
  '<path d="M12 6.5V22M7.4 9.6h9.2M4.2 14.2a7.8 7.8 0 0 0 15.6 0M4.2 14.2l-1.9 1.4M19.8 14.2l1.9 1.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>';

export const ORGS: Record<Org, Publisher> = {
  cct: {
    code: 'cct',
    name: 'Company Consulting Team e.V.',
    note: 'The student consultancy at TU Berlin, where I have been a member since 2024. Its internal tools, the machines they run on, and its public site.',
    url: 'https://www.cct-ev.de',
  },
  tub: {
    code: 'tu berlin',
    name: 'Technische Universitat Berlin',
    note: 'Coursework and both theses from the industrial engineering and IT degrees, bachelor and master.',
    url: 'https://www.tu.berlin',
    mark: { viewBox: '0 0 105.6 80.7', svg: TUB },
  },
  own: {
    code: 'own',
    name: 'Own account',
    note: 'Built for myself and run on my own machines. The source is public wherever it is not personal.',
    mark: { viewBox: '0 0 24 24', svg: ANCHOR },
  },
  client: {
    code: 'client',
    name: 'Under contract',
    note: 'Work for companies that stay unnamed here. The sheets say what was built, not for whom.',
  },
};
