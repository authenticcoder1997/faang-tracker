import test from 'node:test';
import assert from 'node:assert/strict';
import { allDsaTopics, mergeDsaSolved, parseDsaSolvedLinks, planlyDsaSections, planlyDsaTopics } from './dsaPlan.js';
import { applyWorkspacePatch, makeWorkspacePatch } from './workspace.js';
import { createWorkspace } from './workspaceLegacy.js';

test('Planly covers both sprints with unique problem IDs and shares IDs with the full list', () => {
  assert.equal(planlyDsaTopics.length, 179);
  assert.equal(planlyDsaSections.length, 13);
  assert.equal(new Set(planlyDsaTopics.map((item) => item.id)).size, 179);
  assert.equal(new Set(allDsaTopics.map((item) => item.id)).size, allDsaTopics.length);
  assert.equal(new Set(allDsaTopics.map((item) => new URL(item.url).pathname)).size, allDsaTopics.length);
  const all = new Map(allDsaTopics.map((item) => [item.id, item]));
  for (const item of planlyDsaTopics) {
    assert.equal(item.url, all.get(item.id).url);
    assert.match(item.url, /^https:\/\/takeuforward\.org\/practice\/dsa\//);
    assert.ok(['Easy', 'Medium', 'Hard'].includes(item.difficulty));
  }
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
