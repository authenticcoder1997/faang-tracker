import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dsaTopics } from '../data/dsaTopics.js';
import { mergeCachedProgress, readProgressCache, saveProgressCache } from './progressCache.js';

function memoryStorage(entries = []) {
  const values = new Map(entries);
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('the restored tracker matches every problem in the TUF+ audit', () => {
  const audit = JSON.parse(readFileSync(new URL('../../reports/tuf-progress-audit-2026-10-05.json', import.meta.url)));
  assert.equal(dsaTopics.length, 198);
  assert.equal(dsaTopics.filter(item => item.completed).length, 64);
  for (const item of dsaTopics) {
    const checked = audit.problems.find(problem => problem.title === item.title);
    assert.ok(checked, item.title);
    assert.equal(item.completed, checked.solvedInTuf, item.title);
  }
  assert.ok(dsaTopics.find(item => item.title === 'Print root to leaf path in BT').url.includes('/print-root-to-leaf-path-in-bt?'));
});

test('migration restores confirmed completions and retains cached notes and fresh links', () => {
  const initial = [{ id: 'one', url: '/current', completed: true }];
  const saved = [{ id: 'one', url: '/old', completed: false, note: 'My solution' }];
  const storage = memoryStorage([['old', JSON.stringify(saved)]]);
  assert.deepEqual(readProgressCache(initial, 'new', 'old', storage), [
    { id: 'one', url: '/current', completed: true, note: 'My solution' },
  ]);
});

test('local changes survive reload and are not restored again after migration', () => {
  const initial = [{ id: 'one', completed: true }];
  const storage = memoryStorage();
  saveProgressCache('new', [{ id: 'one', completed: false, note: 'Review again' }], storage);
  assert.deepEqual(readProgressCache(initial, 'new', 'old', storage), [
    { id: 'one', completed: false, note: 'Review again' },
  ]);
  saveProgressCache('new', [{ id: 'one', completed: true, note: 'Review again' }], storage);
  assert.equal(readProgressCache(initial, 'new', 'old', storage)[0].completed, true);
});

test('a missing cache or unavailable storage retains restored progress', () => {
  assert.equal(readProgressCache(dsaTopics, 'new', 'old', null), dsaTopics);
  assert.equal(readProgressCache(dsaTopics, 'new', 'old', memoryStorage()), dsaTopics);
  assert.equal(mergeCachedProgress(dsaTopics, {}), dsaTopics);
});
