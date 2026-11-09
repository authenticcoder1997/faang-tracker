import { LEETCODE_DSA_ROWS } from '../data/leetcodeDsaSources.js';
import { allDsaTopics, striverDsaTopics } from './dsaPlan.js';

export const DSA_SOURCES = [
  ['am-600', 'AlgoMaster 600'],
  ['am-300', 'AlgoMaster 300'],
  ['am-150', 'AlgoMaster 150'],
  ['am-75', 'AlgoMaster 75'],
  ['tuf', 'TUF'],
  ['whoami', 'Whoami'],
];
export const DSA_SOURCE_LABELS = Object.fromEntries(DSA_SOURCES);
const LEETCODE = 'https://leetcode.com/problems/';

const normalized = (title) => title.toLowerCase().replace(/[^a-z0-9]/g, '');
const readableSlug = (slug) => slug.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

// Explicit aliases for problems with different titles. Variants such as
// TUF's standalone Pascal's Triangle III are left separate.
const tufAliases = {
  'dsa-3': 'longest-consecutive-sequence',
  'dsa-4': 'spiral-matrix',
  'dsa-5': 'maximum-subarray',
  'dsa-7': 'rotate-image',
  'dsa-11': 'majority-element',
  'dsa-12': 'majority-element-ii',
  'dsa-16': 'maximum-product-subarray',
  'dsa-19': 'subarray-sum-equals-k',
  'dsa-25': 'find-the-smallest-divisor-given-a-threshold',
  'dsa-30': 'median-of-two-sorted-arrays',
  'dsa-32': 'search-a-2d-matrix',
  'dsa-33': 'search-a-2d-matrix-ii',
  'dsa-36': 'subsets',
  'dsa-42': 'n-queens',
  'dsa-48': 'intersection-of-two-linked-lists',
  'dsa-49': 'reverse-linked-list',
  'dsa-50': 'palindrome-linked-list',
  'dsa-51': 'linked-list-cycle-ii',
  'dsa-53': 'reverse-nodes-in-k-group',
  'dsa-55': 'sort-list',
  'dsa-56': 'copy-list-with-random-pointer',
  'dsa-57': 'delete-the-middle-node-of-a-linked-list',
  'dsa-64': 'valid-parentheses',
  'dsa-76': 'next-greater-element-ii',
  'dsa-81': 'min-stack',
  'dsa-88': 'kth-largest-element-in-a-stream',
  'dsa-89': 'binary-tree-preorder-traversal',
  'dsa-90': 'binary-tree-inorder-traversal',
  'dsa-91': 'binary-tree-postorder-traversal',
  'dsa-92': 'binary-tree-level-order-traversal',
  'dsa-93': 'maximum-depth-of-binary-tree',
  'dsa-95': 'binary-tree-maximum-path-sum',
  'dsa-96': 'symmetric-tree',
  'dsa-100': 'binary-tree-right-side-view',
  'dsa-102': 'lowest-common-ancestor-of-a-binary-tree',
  'dsa-103': 'maximum-width-of-binary-tree',
  'dsa-105': 'count-complete-tree-nodes',
  'dsa-106': 'construct-binary-tree-from-preorder-and-inorder-traversal',
  'dsa-107': 'construct-binary-tree-from-inorder-and-postorder-traversal',
  'dsa-108': 'serialize-and-deserialize-binary-tree',
  'dsa-111': 'lowest-common-ancestor-of-a-binary-search-tree',
  'dsa-113': 'construct-binary-search-tree-from-preorder-traversal',
  'dsa-114': 'binary-search-tree-iterator',
  'dsa-116': 'two-sum-iv-input-is-a-bst',
  'dsa-117': 'recover-binary-search-tree',
  'dsa-121': 'flood-fill',
  'dsa-125': 'is-graph-bipartite',
  'dsa-129': 'course-schedule',
  'dsa-134': 'word-ladder',
  'dsa-135': 'word-ladder-ii',
  'dsa-138': 'cheapest-flights-within-k-stops',
  'dsa-142': 'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance',
  'dsa-145': 'number-of-operations-to-make-network-connected',
  'dsa-159': 'unique-paths',
  'dsa-163': 'cherry-pickup-ii',
  'dsa-168': 'best-time-to-buy-and-sell-stock-with-transaction-fee',
  'dsa-177': 'coin-change',
  'dsa-188': 'number-of-longest-increasing-subsequence',
  'planly-sort-an-array-of-0\'s-1\'s-and-2\'s': 'sort-colors',
  'planly-single-element-in-sorted-array': 'single-element-in-a-sorted-array',
  'planly-find-middle-of-linked-list': 'middle-of-the-linked-list',
  'planly-detect-a-loop-in-ll': 'linked-list-cycle',
  'planly-remove-nth-node-from-the-back-of-the-ll': 'remove-nth-node-from-end-of-list',
  'planly-merge-sorted-lists-': 'merge-two-sorted-lists',
  'planly-add-two-numbers-in-ll': 'add-two-numbers',
  'planly-rotate-a-ll': 'rotate-list',
  'planly-stock-span-problem': 'online-stock-span',
  'planly-maximum-rectangles': 'maximal-rectangle',
  'planly-jump-game---i': 'jump-game',
  'planly-print-all-nodes-at-a-distance-of-k-in-bt': 'all-nodes-distance-k-in-binary-tree',
  'planly-insert-a-given-node-in-bst': 'insert-into-a-binary-search-tree',
  'planly-delete-a-node-in-bst': 'delete-node-in-a-bst',
  'planly-check-if-a-tree-is-a-bst-or-not': 'validate-binary-search-tree',
  'planly-distance-of-nearest-cell-having-one': null,
};

const leetSlugs = new Set(LEETCODE_DSA_ROWS.map(([slug]) => slug));
const leetByTitle = new Map(LEETCODE_DSA_ROWS.map(([slug, title]) => [normalized(title || readableSlug(slug)), slug]));
const tufBySlug = new Map();
for (const item of allDsaTopics) {
  const slug = Object.hasOwn(tufAliases, item.id)
    ? tufAliases[item.id]
    : leetByTitle.get(normalized(item.title));
  if (leetSlugs.has(slug) && !tufBySlug.has(slug)) tufBySlug.set(slug, item.id);
}

function algoTopic(pattern) {
  if (/^BST/.test(pattern)) return 'Binary Search Trees';
  if (/Tree Traversal/.test(pattern)) return 'Binary Trees';
  if (/\bDP$|Knapsack|Subsequence \(LIS\)/.test(pattern)) return 'Dynamic Programming';
  if (/^Greedy|^Intervals|^Line Sweep/.test(pattern)) return 'Greedy Algorithms';
  if (/^Shortest Path|^Topological Sort|^Union Find|Spanning Tree|Eulerian|First Search/.test(pattern)) return 'Graphs';
  if (/^Sliding Window/.test(pattern)) return 'Sliding Window';
  if (/^Two Heaps|^Top K|^K-Way/.test(pattern)) return 'Heaps';
  if (/^Monotonic|^Stacks$|^Queues$/.test(pattern)) return 'Stacks & Queues';
  if (/^Linked|^Fast and Slow/.test(pattern)) return 'Linked Lists';
  if (/^Recursion|^Backtracking|^Divide and Conquer/.test(pattern)) return 'Recursion & Backtracking';
  if (/^Maths/.test(pattern)) return 'Mathematics';
  if (/^String Matching/.test(pattern)) return 'Strings';
  if (/^Arrays$|^Hash Tables|^Two Pointers|^Prefix Sum|^Kadane|^Matrix|Sort/.test(pattern)) return 'Arrays & Hashing';
  return pattern;
}

const sheetById = new Map(striverDsaTopics.map((item) => [item.id, item]));
const byId = new Map(allDsaTopics.map((item) => {
  const sheetItem = sheetById.get(item.id);
  return [item.id, {
    ...item,
    ...sheetItem,
    sources: sheetItem ? {
      tuf: { url: sheetItem.url, patterns: [sheetItem.section], title: sheetItem.title },
    } : {},
  }];
}));
for (const [slug, title, difficulty, sizes, patterns, whoami] of LEETCODE_DSA_ROWS) {
  const id = tufBySlug.get(slug) || `lc-${slug}`;
  const url = LEETCODE + slug + '/';
  const algoPatterns = [...new Set([...patterns.map(algoTopic), ...patterns])];
  const lcTitle = title || readableSlug(slug);
  const sources = Object.fromEntries(sizes.map((size) => [
    `am-${size}`, { url, title: lcTitle, patterns: algoPatterns },
  ]));
  if (whoami.length) sources.whoami = { url, title: lcTitle, patterns: whoami };
  const original = byId.get(id);
  byId.set(id, original
    ? { ...original, sources: { ...original.sources, ...sources } }
    : { id, title: lcTitle, url, difficulty: difficulty || 'Unrated',
        section: algoPatterns[0] || whoami[0], completed: false, sources });
}
export const dsaCatalog = [...byId.values()].filter((item) => Object.keys(item.sources).length);

export function matchesDsaSources(item, sources) {
  return !sources.length || sources.some((source) => !!item.sources?.[source]);
}

export function dsaSourceFor(item, selected = []) {
  const available = Object.keys(item.sources || {});
  const matching = available.filter((source) => selected.includes(source));
  const candidates = matching.length ? matching : available;
  return candidates.find((source) => source !== 'tuf') || candidates[0];
}

export function dsaPatternsFor(item, selected = []) {
  if (!item.sources) return item.section ? [item.section] : [];
  return [...new Set(Object.entries(item.sources)
    .filter(([source]) => !selected.length || selected.includes(source))
    .flatMap(([, entry]) => entry.patterns))];
}
