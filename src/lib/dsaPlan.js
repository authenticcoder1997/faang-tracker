import { dsaTopics } from '../data/dsaTopics.js';
import { PLANLY_ROWS } from '../data/dsaPlanly.js';
import { dsaCategory, dsaCategorySections } from '../data/dsaCategories.js';

export const STRIVER_DSA_URL = 'https://takeuforward.org/prep-hub/strivers-180-master-dsa-patterns';
const PRACTICE_BASE = 'https://takeuforward.org/practice/dsa/';
const OLD_EDIT_DISTANCE = 'dsa-189b';
const EDIT_DISTANCE = 'dsa-183';
const difficulties = { Basic: 'Easy', Core: 'Medium', Pro: 'Hard' };
const planById = new Map(PLANLY_ROWS.map((row) => [row[0], row]));
const oldById = new Map(dsaTopics.map((item) => [item.id, item]));

// The 179 practice slugs match the official Striver's 180 sheet.
export const striverDsaTopics = PLANLY_ROWS.map(([id, title, slug, level]) => ({
  id, title, url: PRACTICE_BASE + slug,
  difficulty: difficulties[level],
  section: dsaCategory(id, oldById.get(id)?.section),
  completed: !!oldById.get(id)?.completed,
}));

export const striverDsaSections = dsaCategorySections(striverDsaTopics);

const sheetAdditions = striverDsaTopics.filter((item) => !oldById.has(item.id));
// Keep the older IDs available for LeetCode aliases, imports, and saved reviews.
export const allDsaTopics = [
  ...dsaTopics.filter((item) => item.id !== OLD_EDIT_DISTANCE).map((item) => ({
    ...item,
    section: dsaCategory(item.id, item.section),
    url: planById.has(item.id) ? PRACTICE_BASE + planById.get(item.id)[2]
      : item.url,
  })),
  ...sheetAdditions,
];
export const allDsaSections = dsaCategorySections(allDsaTopics);

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
  ...striverDsaTopics,
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
      ...current,
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
