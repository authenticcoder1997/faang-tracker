import test from 'node:test';
import assert from 'node:assert/strict';
import { deferRevision, markRevisionReviewed, queueRevision, revisionTrack } from './studyRevisions.js';
import { revisionQuestion } from './revisionQuestions.js';
import { applyWorkspacePatch, makeWorkspacePatch, normalizeWorkspace, workspaceWriteFields, reuseWorkspace } from './workspace.js';
import { createWorkspace } from './workspaceLegacy.js';
import { completeStudyQuestion, mergeChangedStudyProgress } from './studyProgress.js';

test('reviews schedule increasingly spaced dates and only count once per day', () => {
  const initial = queueRevision([], 'dsa-5', 'am-600', '2026-11-09');
  assert.equal(initial[0].dueDate, '2026-11-11');
  assert.equal(queueRevision(initial, 'dsa-5', 'tuf', '2026-11-09'), initial);
  const first = markRevisionReviewed(initial, 'dsa-5', '2026-11-11');
  assert.deepEqual(first[0], { id: 'dsa-5', source: 'am-600', reviewCount: 1, reviewedOn: '2026-11-11', dueDate: '2026-11-13' });
  assert.deepEqual(markRevisionReviewed(first, 'dsa-5', '2026-11-11'), first);
  const second = markRevisionReviewed(first, 'dsa-5', '2026-11-13');
  assert.equal(second[0].reviewCount, 2);
  assert.equal(second[0].dueDate, '2026-11-16');
});

test('skipping a revision postpones its due date and keeps its review history', () => {
  const initial = queueRevision([], 'dsa-5', 'tuf', '2026-11-09');
  const reviewed = markRevisionReviewed(initial, 'dsa-5', '2026-11-11');
  const skipped = deferRevision(reviewed, 'dsa-5', 'tuf', '2026-11-18');
  assert.deepEqual(skipped[0], { ...reviewed[0], dueDate: '2026-11-18' });
  assert.equal(deferRevision(skipped, 'dsa-5', 'tuf', '2026-11-17'), skipped);
  assert.equal(markRevisionReviewed(skipped, 'dsa-5', '2026-11-18')[0].reviewCount, 2);
});

test('a skipped question joins the appropriate revision list on its return date', () => {
  const until = '2026-11-19';
  for (const [id, source, track] of [['dsa-5', 'tuf', 'dsa'], ['lld-1', 'lld', 'lld'], ['hld-1', 'hld', 'hld']]) {
    const revisions = deferRevision([], id, source, until);
    assert.deepEqual(revisions, [{ id, source, dueDate: until, reviewCount: 0, reviewedOn: null }]);
    assert.equal(revisionTrack(revisions[0]), track);
    assert.ok(revisionQuestion(revisions[0])?.url);
    assert.equal(deferRevision(revisions, id, source, until), revisions);
  }
});

test('completing with help saves progress and the chosen revision date in the same cloud update', () => {
  const before = createWorkspace();
  const item = { id: 'lld-1' };
  const completedOn = '2026-11-16';
  const homeworkDate = '2026-11-15';
  const reviewOn = '2026-11-21';
  const options = { homeworkDate, source: 'lld', reviewOn };
  const saved = completeStudyQuestion(before, 'lld', item, completedOn, options);
  const remote = { ...before, progress: { ...before.progress, lld: {
    ...before.progress.lld, [item.id]: { completed: false, note: 'An edit from another device' },
  } } };
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, saved));
  assert.deepEqual(result.progress.lld[item.id], {
    completed: true, note: 'An edit from another device', completedOn, homeworkDate,
  });
  assert.deepEqual(result.revisions, [{ id: item.id, source: 'lld', dueDate: reviewOn, reviewCount: 0, reviewedOn: null }]);
  assert.equal(completeStudyQuestion(result, 'lld', item, completedOn, options), result);
});

test('completing without help keeps an existing revision and a chosen date preserves its review history', () => {
  const item = { id: 'hld-1' };
  const before = createWorkspace();
  const initial = queueRevision([], item.id, 'hld', '2026-11-09');
  before.revisions = markRevisionReviewed(initial, item.id, '2026-11-11');
  const completedOn = '2026-11-16';
  const reviewOn = '2026-11-21';
  assert.equal(completeStudyQuestion(before, 'hld', item, completedOn).revisions, before.revisions);
  const scheduled = completeStudyQuestion(before, 'hld', item, completedOn, { source: 'hld', reviewOn });
  assert.deepEqual(scheduled.revisions, [{ ...before.revisions[0], dueDate: reviewOn }]);
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

test('design revisions resolve to the right questions and are due in two days', () => {
  const today = '2026-11-13';
  const lld = queueRevision([], 'lld-1', 'lld', today);
  const mixed = queueRevision(lld, 'hld-1', 'hld', today);
  assert.ok(mixed.every((record) => record.dueDate === '2026-11-15'));
  assert.equal(revisionTrack({ source: null }), 'dsa');
  assert.deepEqual(mixed.map((record) => revisionQuestion(record)?.title), ['Design Tic Tac Toe', 'Bitly']);
  assert.equal(revisionQuestion({ id: 'lld-missing', source: 'lld' }), undefined);
  const reviewed = markRevisionReviewed(mixed, 'lld-1', '2026-11-15');
  assert.equal(reviewed[0].dueDate, '2026-11-17');
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
