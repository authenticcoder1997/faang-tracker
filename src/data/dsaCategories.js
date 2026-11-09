// Broad study topics for the DSA library and Homework.
const topics = [
  ['Arrays & Hashing', /^(Sorting & Arrays|Arrays?\b)/, [], [
    "sort-an-array-of-0's-1's-and-2's", 'next-permutation',
  ]],
  ['Binary Search', /^Binary Search [IVX]+$/, [], [
    'single-element-in-sorted-array', 'find-peak-element-ii',
    'find-nth-root-of-a-number', 'kth-element-of-2-sorted-arrays',
  ]],
  ['Sliding Window', /^Sliding Window /, ['dsa-82'], []],
  ['Strings', /^String and Trie$/, [], ['shortest-palindrome']],
  ['Linked Lists', /^Linked List /, [], [
    'find-middle-of-linked-list', 'detect-a-loop-in-ll',
    'remove-nth-node-from-the-back-of-the-ll', 'merge-sorted-lists-',
    'add-two-numbers-in-ll', 'rotate-a-ll',
  ]],
  ['Stacks & Queues', /^Stack and Queue /, ['dsa-64'], [
    'stock-span-problem', 'maximum-rectangles', 'celebrity-problem',
    'next-greater-element', 'lfu-cache',
  ]],
  ['Heaps', /^Heaps$/, [], ['heapify-algorithm', 'build-heap-from-a-given-array', 'implement-min-heap']],
  ['Recursion & Backtracking', /^Recursion /, [], [
    'generate-parentheses', 'letter-combinations-of-a-phone-number', 'subsets-ii', 'word-search',
  ]],
  ['Greedy Algorithms', /^Greedy Algorithms$/, [], [
    'jump-game---i', 'insert-interval', 'job-sequencing-problem',
  ]],
  ['Binary Trees', /^Binary Tree /, [], ['print-all-nodes-at-a-distance-of-k-in-bt']],
  ['Binary Search Trees', /^Binary Search Tree /, ['dsa-111', 'dsa-112', 'dsa-113'], [
    'insert-a-given-node-in-bst', 'delete-a-node-in-bst', 'check-if-a-tree-is-a-bst-or-not',
  ]],
  ['Graphs', /^Graph /, [], ['distance-of-nearest-cell-having-one', 'detect-a-cycle-in-an-undirected-graph']],
  ['Dynamic Programming', /^Dynamic Programming /, [], [
    'longest-palindromic-subsequence', 'matrix-chain-multiplication', 'palindrome-partitioning-ii-',
  ]],
  ['Tries', null, ['dsa-193', 'dsa-194'], [
    'trie-implementation-and-advanced-operations', 'number-of-distinct-substrings-in-a-string',
    'maximum-xor-of-two-numbers-in-an-array',
  ]],
  ['Bit Manipulation', null, ['dsa-58', 'dsa-59', 'dsa-60'], ['power-set-bit-manipulation']],
  ['Mathematics', null, ['dsa-151', 'dsa-152', 'dsa-153'], []],
];

const byId = new Map(topics.flatMap(([name, , ids, slugs]) => [
  ...ids.map((id) => [id, name]),
  ...slugs.map((slug) => [`planly-${slug}`, name]),
]));
const OTHER = 'Other Topics';

export function dsaCategory(id, previousSection = '') {
  return byId.get(id) ?? topics.find(([, pattern]) => pattern?.test(previousSection))?.[0] ?? OTHER;
}

export function dsaCategorySections(items) {
  const present = new Set(items.map((item) => item.section));
  return [...topics.map(([name]) => name), OTHER]
    .filter((name) => present.has(name))
    .map((name) => ({ name }));
}
