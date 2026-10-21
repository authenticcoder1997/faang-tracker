import test from 'node:test';
import assert from 'node:assert/strict';
import {
  markNotesSynced,
  mergeCloudNotes,
  NOTES_STORAGE_KEY,
  notesMatchCloud,
  readNotesCache,
  reconcileNotesSnapshot,
  saveNotesCache,
  updateNotesCache,
} from './notesCache.js';

const note = (
  id = 'one',
  content = 'A thought',
  updatedAt = '2026-10-21T12:00:00Z',
) => ({
  id,
  title: 'My note',
  content,
  updatedAt,
});
const memoryStorage = (raw = null) => {
  const values = new Map(raw ? [[NOTES_STORAGE_KEY, raw]] : []);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};

test('legacy notes restore immediately and survive the new cache format', () => {
  const storage = memoryStorage(
    JSON.stringify([note(), null, { wrong: true }]),
  );
  const restored = readNotesCache(storage);
  assert.deepEqual(restored.cache.notes, [note()]);
  assert.deepEqual(restored.cache.pendingIds, ['one']);
  assert.equal(restored.hasCache, true);
  assert.equal(saveNotesCache(restored.cache, storage), null);
  assert.deepEqual(readNotesCache(storage).cache.notes, [note()]);
});

test('unsynced edits survive reload and stale cloud snapshots without losing remote additions', () => {
  const storage = memoryStorage(JSON.stringify([note()]));
  const edited = note('one', 'A newer thought', '2026-10-21T13:00:00Z');
  const cache = updateNotesCache(readNotesCache(storage).cache, [edited]);
  saveNotesCache(cache, storage);
  const merged = mergeCloudNotes(
    readNotesCache(storage).cache,
    [note(), note('two')],
    true,
  );
  assert.deepEqual(merged.notes, [edited, note('two')]);
  assert.equal(notesMatchCloud(merged, [note(), note('two')]), false);
});

test('local deletions remain deleted across refresh and stale cloud reads', () => {
  const storage = memoryStorage(JSON.stringify([note()]));
  const deleted = updateNotesCache(readNotesCache(storage).cache, []);
  saveNotesCache(deleted, storage);
  const restored = readNotesCache(storage).cache;
  assert.deepEqual(mergeCloudNotes(restored, [note()], true).notes, []);
  assert.deepEqual(
    mergeCloudNotes(markNotesSynced(restored), [note()], true).notes,
    [],
  );
});

test('newer cloud edits are accepted and confirmed remote deletions propagate for unchanged synced notes', () => {
  const cache = markNotesSynced(
    readNotesCache(memoryStorage(JSON.stringify([note()]))).cache,
  );
  const remote = note('one', 'From another device', '2026-10-21T14:00:00Z');
  assert.deepEqual(mergeCloudNotes(cache, [remote], true).notes, [remote]);
  assert.deepEqual(mergeCloudNotes(cache, [], false).notes, [note()]);
  assert.deepEqual(mergeCloudNotes(cache, [], true).notes, []);
});

test('synced newer local edits still win over an older cloud version', () => {
  const newer = note('one', 'Newer saved text', '2026-10-21T15:00:00Z');
  const cache = markNotesSynced(
    readNotesCache(memoryStorage(JSON.stringify([newer]))).cache,
  );
  assert.deepEqual(mergeCloudNotes(cache, [note()], true).notes, [newer]);
});

test('unavailable, corrupt, and quota-limited storage never throw', () => {
  assert.equal(readNotesCache(null).storageError, 'unavailable');
  assert.deepEqual(readNotesCache(memoryStorage('{invalid')).cache.notes, []);
  const blocked = {
    getItem() {
      throw new Error('denied');
    },
    setItem() {
      throw new Error('quota');
    },
  };
  assert.equal(readNotesCache(blocked).storageError, 'unavailable');
  assert.equal(
    saveNotesCache(readNotesCache(memoryStorage()).cache, blocked),
    'unavailable',
  );
});

test('cloud writes wait for confirmed data and include unseen other-device notes', () => {
  const storage = memoryStorage(JSON.stringify([note()]));
  const localEdit = note('one', 'Changed before the server answered', '2026-10-21T16:00:00Z');
  const cache = updateNotesCache(readNotesCache(storage).cache, [localEdit]);
  const offline = reconcileNotesSnapshot(cache, [note()], false);
  assert.equal(offline.shouldWrite, false);
  assert.deepEqual(offline.cache.notes, [localEdit]);
  assert.deepEqual(offline.cache.pendingIds, ['one']);

  const confirmed = reconcileNotesSnapshot(offline.cache, [note(), note('other-device')], true);
  assert.equal(confirmed.shouldWrite, true);
  assert.deepEqual(confirmed.cache.notes, [localEdit, note('other-device')]);
  const acknowledged = reconcileNotesSnapshot(confirmed.cache, confirmed.cache.notes, true);
  assert.equal(acknowledged.shouldWrite, false);
  assert.deepEqual(acknowledged.cache.pendingIds, []);
});
