import test from 'node:test';
import assert from 'node:assert/strict';
import { markRevisionReviewed, queueRevision, revisionDueLabel, revisionTrack } from './studyRevisions.js';
import { revisionQuestion } from './revisionQuestions.js';
import { applyWorkspacePatch, makeWorkspacePatch, normalizeWorkspace, workspaceWriteFields, reuseWorkspace } from './workspace.js';
import { createWorkspace } from './workspaceLegacy.js';
import { mergeChangedStudyProgress } from './studyProgress.js';

test('revision due labels count calendar days across months and years', () => {
  assert.equal(revisionDueLabel('2026-12-31', '2027-01-01'), '1 day overdue');
  assert.equal(revisionDueLabel('2026-12-30', '2027-01-02'), '3 days overdue');
  assert.equal(revisionDueLabel('2027-01-02', '2027-01-02'), 'Due today');
  assert.equal(revisionDueLabel('2027-01-03', '2027-01-02'), 'Due in 1 day');
});

test('reviews schedule increasingly spaced dates and only count once per day', () => {
  const initial = queueRevision([], 'dsa-5', 'am-600', '2026-11-09');
  assert.equal(queueRevision(initial, 'dsa-5', 'tuf', '2026-11-09'), initial);
  const first = markRevisionReviewed(initial, 'dsa-5', '2026-11-09');
  assert.deepEqual(first[0], { id: 'dsa-5', source: 'am-600', reviewCount: 1, reviewedOn: '2026-11-09', dueDate: '2026-11-10' });
  assert.deepEqual(markRevisionReviewed(first, 'dsa-5', '2026-11-09'), first);
  const second = markRevisionReviewed(first, 'dsa-5', '2026-11-10');
  assert.equal(second[0].reviewCount, 2);
  assert.equal(second[0].dueDate, '2026-11-13');
});

test('revision writes merge across devices without modifying solved progress or notes', () => {
  const before = createWorkspace();
  const legacy = { ...before };
  delete legacy.revisions;
  assert.deepEqual(normalizeWorkspace(legacy).revisions, []);
  const after = { ...before, revisions: queueRevision(before.revisions, 'dsa-5', 'tuf', '2026-11-09') };
  const remote = {
    ...before,
    revisions: queueRevision(before.revisions, 'hld-1', 'hld', '2026-11-09'),
    progress: { ...before.progress, dsa: { ...before.progress.dsa, 'dsa-5': { completed: true, note: 'From phone' } } },
  };
  const merged = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.equal(merged.revisions.length, 2);
  assert.deepEqual(new Set(merged.revisions.map(revisionTrack)), new Set(['dsa', 'hld']));
  assert.deepEqual(merged.progress.dsa['dsa-5'], { completed: true, note: 'From phone' });
  const base = normalizeWorkspace(remote);
  assert.deepEqual(Object.keys(workspaceWriteFields(base, reuseWorkspace(base, merged))), ['revisions']);
});

test('design revisions resolve to the right questions and use the existing review schedule', () => {
  const today = '2026-11-13';
  const lld = queueRevision([], 'lld-1', 'lld', today);
  const mixed = queueRevision(lld, 'hld-1', 'hld', today);
  assert.equal(revisionTrack({ source: null }), 'dsa');
  assert.deepEqual(mixed.map((record) => revisionQuestion(record)?.title), ['Design Tic Tac Toe', 'Bitly']);
  assert.equal(revisionQuestion({ id: 'lld-missing', source: 'lld' }), undefined);
  const reviewed = markRevisionReviewed(mixed, 'lld-1', today);
  assert.equal(reviewed[0].dueDate, '2026-11-14');
  assert.equal(reviewed[1], mixed[1]);
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
