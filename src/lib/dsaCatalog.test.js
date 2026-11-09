import test from 'node:test';
import assert from 'node:assert/strict';
import { dsaCatalog, dsaPatternsFor, dsaSourceFor, matchesDsaSources } from './dsaCatalog.js';
import { filterDsaProblems } from './dsaFilters.js';
import { allDsaTopics } from './dsaPlan.js';

test('catalog membership is complete and overlapping source selections show unique problems', () => {
  const expected = { 'am-600': 600, 'am-300': 300, 'am-150': 150, 'am-75': 75, tuf: 238, whoami: 127 };
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

test('TUF IDs, titles, and links stay intact, and the chosen source controls the link', () => {
  const items = new Map(dsaCatalog.map((item) => [item.id, item]));
  for (const old of allDsaTopics) {
    const entry = items.get(old.id);
    assert.equal(entry.sources.tuf.url, old.url);
    assert.equal(entry.sources.tuf.title, old.title);
    assert.deepEqual(entry.sources.tuf.patterns, [old.section]);
  }
  const kadane = items.get('dsa-5');
  assert.equal(dsaSourceFor(kadane, ['tuf']), 'tuf');
  const leet = dsaSourceFor(kadane, ['am-600', 'tuf']);
  assert.equal(kadane.sources[leet].url, 'https://leetcode.com/problems/maximum-subarray/');
  assert.ok(dsaPatternsFor(kadane, ['am-600']).includes("Kadane's Algorithm"));
  assert.deepEqual(filterDsaProblems([kadane], {
    query: 'maximum subarray', statuses: [], patterns: ["Kadane's Algorithm"], difficulties: [],
  }, ['am-600']), [kadane]);
});
