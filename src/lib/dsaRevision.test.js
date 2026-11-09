import test from 'node:test';
import assert from 'node:assert/strict';
import { queueDsaRevision, reviewDsaProblem } from './dsaRevision.js';
import { applyWorkspacePatch, makeWorkspacePatch, normalizeWorkspace, workspaceWriteFields, reuseWorkspace } from './workspace.js';
import { createWorkspace } from './workspaceLegacy.js';
import { mergeChangedStudyProgress } from './studyProgress.js';

test('reviews schedule increasingly spaced dates and only count once per day', () => {
  const initial = queueDsaRevision([], 'dsa-5', 'am-600', '2026-11-09');
  assert.equal(queueDsaRevision(initial, 'dsa-5', 'tuf', '2026-11-09'), initial);
  const first = reviewDsaProblem(initial, 'dsa-5', '2026-11-09');
  assert.deepEqual(first[0], { id: 'dsa-5', source: 'am-600', reviewCount: 1, reviewedOn: '2026-11-09', dueDate: '2026-11-10' });
  assert.deepEqual(reviewDsaProblem(first, 'dsa-5', '2026-11-09'), first);
  const second = reviewDsaProblem(first, 'dsa-5', '2026-11-10');
  assert.equal(second[0].reviewCount, 2);
  assert.equal(second[0].dueDate, '2026-11-13');
});

test('revision writes merge across devices without modifying solved progress or notes', () => {
  const before = createWorkspace();
  const legacy = { ...before };
  delete legacy.revisions;
  assert.deepEqual(normalizeWorkspace(legacy).revisions, []);
  const after = { ...before, revisions: queueDsaRevision(before.revisions, 'dsa-5', 'tuf', '2026-11-09') };
  const remote = {
    ...before,
    revisions: queueDsaRevision(before.revisions, 'lc-two-sum', 'whoami', '2026-11-09'),
    progress: { ...before.progress, dsa: { ...before.progress.dsa, 'dsa-5': { completed: true, note: 'From phone' } } },
  };
  const merged = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.equal(merged.revisions.length, 2);
  assert.deepEqual(merged.progress.dsa['dsa-5'], { completed: true, note: 'From phone' });
  const base = normalizeWorkspace(remote);
  assert.deepEqual(Object.keys(workspaceWriteFields(base, reuseWorkspace(base, merged))), ['revisions']);
});

test('one study edit does not create progress for the rest of an imported catalog', () => {
  const previous = [
    { id: 'lc-two-sum', completed: false },
    { id: 'lc-3sum', completed: false },
    { id: 'dsa-5', completed: true, note: 'Original' },
  ];
  const existing = { 'dsa-5': { completed: true, note: 'Original' } };
  const next = [{ ...previous[0], completed: true }, ...previous.slice(1)];
  const merged = mergeChangedStudyProgress(existing, previous, next);
  assert.deepEqual(merged, { ...existing, 'lc-two-sum': { completed: true, note: '' } });
  assert.equal(mergeChangedStudyProgress(existing, previous, previous), existing);
});
