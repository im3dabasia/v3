// Fetches every pull request authored by the site owner in the Gutenberg
// repository and writes them to _data/ for Jekyll to render.
//
// Runs unauthenticated locally (60 requests/hour, plenty for two pages) and
// with GITHUB_TOKEN in CI, which raises the limit to 5000/hour.
//
//   node build/fetch-prs.mjs

import { writeFile, readFile } from 'node:fs/promises';

const REPO = 'WordPress/gutenberg';
const AUTHOR = 'im3dabasia';
const OUT = '_data/gutenberg_prs.json';
const PER_PAGE = 100;
// The search API caps out at 1000 results; this is a guard against paging
// forever if that ever changes.
const MAX_PAGES = 10;

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

async function search(page) {
  const q = encodeURIComponent(`repo:${REPO} type:pr author:${AUTHOR}`);
  const url = `https://api.github.com/search/issues?q=${q}&per_page=${PER_PAGE}&page=${page}&sort=created&order=desc`;

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': `${AUTHOR}-site-pr-tracker`,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(
      `GitHub API ${res.status} ${res.statusText}: ${(await res.text()).slice(0, 300)}`
    );
  }
  return res.json();
}

// merged and closed-without-merging are both "closed" to the API, but they
// mean very different things on a portfolio, so split them here.
function stateOf(item) {
  if (item.pull_request?.merged_at) return 'merged';
  if (item.state === 'open') return 'open';
  return 'closed';
}

/* --- colour helpers -------------------------------------------------------
 * Labels are drawn as a tinted background with a border and text in the
 * label's own colour. Raw repository colours are picked for legibility on a
 * solid swatch, not as text, so a pale lime is invisible on white and a deep
 * indigo is invisible on the dark theme. Both text colours are therefore
 * nudged until they clear the WCAG AA contrast ratio against the background
 * they will actually sit on.
 */

function toRgb(hex) {
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function relativeLuminance([r, g, b]) {
  const f = c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Walk the colour toward the target until it is readable on `bg`.
function readableAgainst(rgb, bg, toward) {
  let out = rgb;
  for (let i = 0; i < 24 && contrast(out, bg) < 4.5; i++) {
    out = out.map((c, j) => c + (toward[j] - c) * 0.08);
  }
  return toHex(out);
}

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];
const NIGHT_BG = [23, 28, 40]; // $night

// Labels are namespaced as "[Type] Bug", "[Package] Components" and so on.
// Split the namespace out so the page can group and filter by it, and carry
// the repository's own colour through so they look like they do on GitHub.
function parseLabel(label) {
  const name = label.name;
  const hex = (label.color || '888888').toLowerCase();
  const rgb = toRgb(hex);
  const m = name.match(/^\[([^\]]+)\]\s*(.+)$/);
  const parsed = m ? { group: m[1], name: m[2].trim() } : { group: null, name };

  return {
    ...parsed,
    full: name,
    color: `#${hex}`,
    // Space separated so the template can drop it into rgb(… / alpha).
    rgb: rgb.join(' '),
    text: readableAgainst(rgb, WHITE, BLACK),
    text_night: readableAgainst(rgb, NIGHT_BG, WHITE),
  };
}

const items = [];
for (let page = 1; page <= MAX_PAGES; page++) {
  const data = await search(page);
  items.push(...data.items);
  if (items.length >= data.total_count || data.items.length < PER_PAGE) break;
}

const prs = items
  .map(item => {
    const state = stateOf(item);
    return {
      number: item.number,
      title: item.title,
      url: item.html_url,
      state,
      created_at: item.created_at,
      // The date that matters for sorting: when it landed, or when it was
      // opened if it has not landed yet.
      dated_at: item.pull_request?.merged_at || item.closed_at || item.created_at,
      labels: item.labels.map(parseLabel),
      comments: item.comments,
    };
  })
  .sort((a, b) => b.dated_at.localeCompare(a.dated_at));

const counts = prs.reduce(
  (acc, pr) => ({ ...acc, [pr.state]: (acc[pr.state] || 0) + 1 }),
  {}
);

// Facets for the filter controls, most used first.
function facet(group) {
  const tally = new Map();
  for (const pr of prs) {
    for (const l of pr.labels) {
      if (l.group === group) tally.set(l.name, (tally.get(l.name) || 0) + 1);
    }
  }
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));
}

const payload = {
  repo: REPO,
  author: AUTHOR,
  search_url: `https://github.com/${REPO}/pulls?q=is%3Apr+author%3A${AUTHOR}`,
  total: prs.length,
  merged: counts.merged || 0,
  open: counts.open || 0,
  closed: counts.closed || 0,
  types: facet('Type'),
  packages: facet('Package'),
  prs,
};

// Keep the committed file stable when nothing changed, so the scheduled job
// does not produce an empty commit every day.
const next = JSON.stringify(payload, null, 2) + '\n';
let current = null;
try {
  current = await readFile(OUT, 'utf8');
} catch {
  /* first run */
}

if (current === next) {
  console.log(`No change (${payload.total} PRs).`);
} else {
  await writeFile(OUT, next);
  console.log(
    `Wrote ${OUT}: ${payload.total} PRs ` +
      `(${payload.merged} merged, ${payload.open} open, ${payload.closed} closed).`
  );
}
