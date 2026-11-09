import test from 'node:test';
import assert from 'node:assert/strict';
import { allDsaSections, allDsaTopics, mergeDsaSolved, parseDsaSolvedLinks, striverDsaSections, striverDsaTopics } from './dsaPlan.js';
import { applyWorkspacePatch, makeWorkspacePatch } from './workspace.js';
import { createWorkspace } from './workspaceLegacy.js';

test('topic views cover the whole catalog and keep the same problem IDs and links', () => {
  assert.equal(striverDsaTopics.length, 179);
  assert.equal(new Set(striverDsaTopics.map((item) => item.id)).size, 179);
  assert.equal(new Set(allDsaTopics.map((item) => item.id)).size, allDsaTopics.length);
  assert.equal(new Set(allDsaTopics.map((item) => new URL(item.url).pathname)).size, allDsaTopics.length);
  const all = new Map(allDsaTopics.map((item) => [item.id, item]));
  for (const item of striverDsaTopics) {
    assert.equal(item.url, all.get(item.id).url);
    assert.equal(item.section, all.get(item.id).section);
    assert.match(item.url, /^https:\/\/takeuforward\.org\/practice\/dsa\//);
    assert.ok(['Easy', 'Medium', 'Hard'].includes(item.difficulty));
  }
  for (const [items, sections] of [[striverDsaTopics, striverDsaSections], [allDsaTopics, allDsaSections]]) {
    assert.deepEqual(new Set(sections.map(({ name }) => name)), new Set(items.map(({ section }) => section)));
    assert.ok(sections.every(({ name }) => !/Sprint|Day|Other Topics/.test(name)));
  }
  const sheetById = new Map(striverDsaTopics.map((item) => [item.id, item.section]));
  assert.equal(sheetById.get('planly-matrix-chain-multiplication'), 'Dynamic Programming');
  assert.equal(sheetById.get('dsa-178'), 'Dynamic Programming');
  assert.equal(sheetById.get('planly-power-set-bit-manipulation'), 'Bit Manipulation');
  assert.equal(sheetById.get('dsa-64'), 'Stacks & Queues');
  assert.equal(sheetById.get('dsa-117'), 'Binary Search Trees');
  assert.equal(all.get('dsa-114').section, 'Binary Search Trees');
});

test('import recognizes official problem links, deduplicates aliases, and flags unrelated links', () => {
  const result = parseDsaSolvedLinks([
    'https://takeuforward.org/practice/dsa/3-sum?tab=solution',
    'https://takeuforward.org/plus/dsa/problems/3-sum',
    'https://takeuforward.org/practice/dsa/next-permutation',
    'https://takeuforward.org/planly/dsa',
    'https://other.example/practice/dsa/3-sum',
  ].join('\n'));
  assert.deepEqual(result.ids, ['dsa-9', 'planly-next-permutation']);
  assert.deepEqual(result.unmatched, ['https://takeuforward.org/planly/dsa', 'https://other.example/practice/dsa/3-sum']);
});

test('import adds solves without erasing another device’s notes or other progress', () => {
  const before = createWorkspace();
  const ids = ['dsa-9', 'planly-next-permutation'];
  const remote = structuredClone(before);
  remote.progress.dsa['dsa-9'].note = 'Phone note';
  remote.progress.dsa['dsa-21'].completed = true;
  const after = { ...before, progress: { ...before.progress, dsa: mergeDsaSolved(before.progress.dsa, ids) } };
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.deepEqual(result.progress.dsa['dsa-9'], { completed: true, note: 'Phone note' });
  assert.deepEqual(result.progress.dsa['planly-next-permutation'], { completed: true, note: '' });
  assert.equal(result.progress.dsa['dsa-21'].completed, true);
  assert.deepEqual(mergeDsaSolved(result.progress.dsa, ids), result.progress.dsa);
});
