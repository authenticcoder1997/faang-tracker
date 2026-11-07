import { dsaTopics, DSA_SECTIONS_LIST } from '../data/dsaTopics.js';
import { PLANLY_ROWS } from '../data/dsaPlanly.js';

export const PLANLY_DSA_URL = 'https://takeuforward.org/planly/dsa';
const PRACTICE_BASE = 'https://takeuforward.org/practice/dsa/';
const OLD_EDIT_DISTANCE = 'dsa-189b';
const EDIT_DISTANCE = 'dsa-183';
const difficulties = { Basic: 'Easy', Core: 'Medium', Pro: 'Hard' };
const planById = new Map(PLANLY_ROWS.map((row) => [row[0], row]));
const oldById = new Map(dsaTopics.map((item) => [item.id, item]));

export const planlyDsaTopics = PLANLY_ROWS.map(([id, title, slug, level, sprint, day]) => ({
  id, title, url: PRACTICE_BASE + slug,
  difficulty: difficulties[level],
  section: `Sprint ${sprint} · Day ${day}`,
  completed: !!oldById.get(id)?.completed,
}));

export const planlyDsaSections = [...new Set(planlyDsaTopics.map((item) => item.section))]
  .map((name) => ({ name }));

const planlyOnly = planlyDsaTopics.filter((item) => !oldById.has(item.id));
export const allDsaTopics = [
  ...dsaTopics.filter((item) => item.id !== OLD_EDIT_DISTANCE).map((item) => ({
    ...item,
    url: planById.has(item.id) ? PRACTICE_BASE + planById.get(item.id)[2]
      : item.url,
  })),
  ...planlyOnly.map((item) => ({ ...item, section: 'Additional Planly problems' })),
];
export const allDsaSections = [
  ...DSA_SECTIONS_LIST,
  ...(planlyOnly.length ? [{ name: 'Additional Planly problems' }] : []),
];

function problemSlug(address) {
  try {
    const url = new URL(address);
    if (url.protocol !== 'https:' || url.hostname !== 'takeuforward.org' || url.username || url.password || url.port)
      return null;
    const match = url.pathname.match(/^\/(?:practice\/dsa|plus\/dsa\/problems)\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

const bySlug = new Map([
  ...dsaTopics.filter((item) => item.id !== OLD_EDIT_DISTANCE),
  ...allDsaTopics,
  ...planlyDsaTopics,
].map((item) => [problemSlug(item.url), item.id]));

export function parseDsaSolvedLinks(text) {
  const matched = new Set();
  const unmatched = new Set();
  for (const link of text.trim().split(/\s+/).filter(Boolean)) {
    const id = bySlug.get(problemSlug(link));
    if (id) matched.add(id);
    else unmatched.add(link);
  }
  return { ids: [...matched], unmatched: [...unmatched] };
}

/** Keep unrelated progress and notes; the import only adds confirmed solves. */
export function mergeDsaSolved(progress, ids) {
  const next = { ...progress };
  // The old library listed Edit Distance twice. Preserve its earlier note or
  // completion under the ID shared by the new views; leave the old record intact.
  const oldEdit = progress[OLD_EDIT_DISTANCE];
  if (oldEdit?.completed || oldEdit?.note) {
    const current = progress[EDIT_DISTANCE];
    next[EDIT_DISTANCE] = {
      completed: !!(current?.completed || oldEdit.completed),
      note: current?.note || oldEdit.note || '',
    };
  }
  for (const id of ids) {
    if (!next[id]?.completed)
      next[id] = { completed: true, note: next[id]?.note || '' };
  }
  return next;
}
