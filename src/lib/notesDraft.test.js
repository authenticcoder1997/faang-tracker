import assert from 'node:assert/strict';
import test from 'node:test';
import { applyNoteDraft, createNoteDraft, editNoteDraft } from './notesDraft.js';

const initial = { id: 'note', title: 'Original title', content: 'Original content', updatedAt: '2026-10-21T00:00:00.000Z' };
const now = '2026-10-22T00:00:00.000Z';

test('a local title edit preserves content received from another device before saving', () => {
  const draft = editNoteDraft(createNoteDraft(initial.id), initial, 'title', 'Local title');
  const remote = { ...initial, content: 'Remote content', extra: 'keep' };
  assert.deepEqual(applyNoteDraft([remote], draft, now), [{ ...remote, title: 'Local title', updatedAt: now }]);
});

test('a local content edit preserves a remote title and unrelated notes', () => {
  const draft = editNoteDraft(createNoteDraft(initial.id), initial, 'content', 'Local content');
  const remote = { ...initial, title: 'Remote title' };
  const unrelated = { id: 'other', title: 'Other', content: 'Keep', updatedAt: now };
  const result = applyNoteDraft([unrelated, remote], draft, now);
  assert.equal(result[0], unrelated);
  assert.deepEqual(result[1], { ...remote, content: 'Local content', updatedAt: now });
});

test('reverting a field to its editing baseline releases that field to the remote value', () => {
  let draft = editNoteDraft(createNoteDraft(initial.id), initial, 'title', 'Local title');
  const remote = { ...initial, title: 'Remote title', content: 'Remote content' };
  draft = editNoteDraft(draft, remote, 'title', initial.title);
  assert.deepEqual(draft.fields, {});
  const notes = [remote];
  assert.equal(applyNoteDraft(notes, draft, now), notes);
});

test('editing a second field uses its latest observed value as a separate baseline', () => {
  let draft = editNoteDraft(createNoteDraft(initial.id), initial, 'title', 'Local title');
  const remote = { ...initial, content: 'Remote content' };
  draft = editNoteDraft(draft, remote, 'content', 'Local content');
  draft = editNoteDraft(draft, remote, 'title', initial.title);
  assert.deepEqual(draft.fields, { content: 'Local content' });
  assert.deepEqual(draft.baseline, { content: 'Remote content' });
  assert.deepEqual(applyNoteDraft([{ ...remote, title: 'New remote title' }], draft, now), [{ ...remote, title: 'New remote title', content: 'Local content', updatedAt: now }]);
});

test('draft saving does not resurrect a note deleted on another device', () => {
  const draft = editNoteDraft(createNoteDraft(initial.id), initial, 'title', 'Local title');
  const notes = [];
  assert.equal(applyNoteDraft(notes, draft, now), notes);
});

test('an already applied draft does not create another update', () => {
  const draft = editNoteDraft(createNoteDraft(initial.id), initial, 'title', 'Local title');
  const notes = [{ ...initial, title: 'Local title' }];
  assert.equal(applyNoteDraft(notes, draft, now), notes);
});
