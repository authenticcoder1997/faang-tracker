import test from 'node:test';
import assert from 'node:assert/strict';
import { dsaCatalog, dsaPatternsFor, dsaSourceFor, matchesDsaSources } from './dsaCatalog.js';
import { filterDsaProblems } from './dsaFilters.js';
import { striverDsaTopics } from './dsaPlan.js';

test('catalog membership is complete and overlapping source selections show unique problems', () => {
  const expected = { 'am-600': 600, 'am-300': 300, 'am-150': 150, 'am-75': 75, tuf: 179, whoami: 127 };
  assert.equal(new Set(dsaCatalog.map((item) => item.id)).size, dsaCatalog.length);
  for (const [source, count] of Object.entries(expected)) {
    const items = dsaCatalog.filter((item) => matchesDsaSources(item, [source]));
    assert.equal(items.length, count);
    for (const { sources } of items) {
      const url = new URL(sources[source].url);
      assert.equal(url.hostname, source === 'tuf' ? 'takeuforward.org' : 'leetcode.com');
      assert.ok(sources[source].patterns.length);
    }
  }
  assert.equal(dsaCatalog.filter((item) => matchesDsaSources(item, ['am-600', 'am-75'])).length, 600);
});

test('TUF shows exactly the Striver sheet while existing LeetCode aliases keep their IDs', () => {
  const items = new Map(dsaCatalog.map((item) => [item.id, item]));
  for (const sheetItem of striverDsaTopics) {
    const entry = items.get(sheetItem.id);
    assert.equal(entry.sources.tuf.url, sheetItem.url);
    assert.equal(entry.sources.tuf.title, sheetItem.title);
    assert.deepEqual(entry.sources.tuf.patterns, [sheetItem.section]);
  }
  assert.equal(items.has('dsa-1'), false);
  assert.equal(items.get('dsa-114').sources.tuf, undefined);
  assert.equal(items.get('dsa-114').sources['am-600'].url, 'https://leetcode.com/problems/binary-search-tree-iterator/');
  const kadane = items.get('dsa-5');
  assert.equal(dsaSourceFor(kadane, ['tuf']), 'tuf');
  const leet = dsaSourceFor(kadane, ['am-600', 'tuf']);
  assert.equal(kadane.sources[leet].url, 'https://leetcode.com/problems/maximum-subarray/');
  assert.ok(dsaPatternsFor(kadane, ['am-600']).includes("Kadane's Algorithm"));
  assert.deepEqual(filterDsaProblems([kadane], {
    query: 'maximum subarray', statuses: [], patterns: ["Kadane's Algorithm"], difficulties: [],
  }, ['am-600']), [kadane]);
});
