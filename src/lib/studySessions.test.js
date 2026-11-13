import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyStudySessionPatch, deleteStudySession, diffStudySessions, editStudySession, logStudyTime,
  normalizeStudySession, studySessionsByDate,
} from './studySessions.js';

const hour = 3_600_000;
const timestamp = (localTime) => new Date(localTime).getTime();

test('a backdated manual entry syncs and counts only on the chosen day', () => {
  const loggedAt = timestamp('2026-11-13T18:00:00');
  const next = logStudyTime([], 'backdated', 2 * hour, loggedAt, '2026-11-11');
  const patch = JSON.parse(JSON.stringify(diffStudySessions([], next)));
  const sessions = applyStudySessionPatch([], patch).map(normalizeStudySession);
  const days = studySessionsByDate(sessions, '2026-11-10', '2026-11-13');

  assert.equal(days.size, 1);
  assert.equal(days.get('2026-11-11')[0].duration, 2 * hour);
  assert.equal(studySessionsByDate(sessions, '2026-11-13').size, 0);
  assert.deepEqual(applyStudySessionPatch(sessions, patch), sessions);
});

test('legacy manual entries use the original log date and live timers split at midnight', () => {
  const startedAt = timestamp('2026-11-11T23:00:00');
  const stoppedAt = timestamp('2026-11-12T02:00:00');
  const legacy = logStudyTime([], 'manual', 4 * hour, stoppedAt);
  const sessions = [...legacy, { id: 'timer', startedAt, stoppedAt },
    { id: 'active', startedAt: stoppedAt, stoppedAt: null }];
  const days = studySessionsByDate(sessions, '2026-11-10', '2026-11-13');

  assert.deepEqual([...days.get('2026-11-11')].map(({ duration }) => duration), [hour]);
  assert.deepEqual(days.get('2026-11-12').map(({ duration }) => duration), [4 * hour, 2 * hour]);
  assert.deepEqual(studySessionsByDate(sessions, '2026-11-12').get('2026-11-12'), days.get('2026-11-12'));
  assert.equal(days.size, 2);
});

test('editing moves an existing entry by ID without duplicating it or reviving a deleted entry', () => {
  const loggedAt = timestamp('2026-11-13T18:00:00');
  const before = logStudyTime([], 'manual', 2 * hour, loggedAt);
  const next = editStudySession(before, 'manual', 5 * hour, '2026-11-12');
  const patch = JSON.parse(JSON.stringify(diffStudySessions(before, next)));
  const remote = logStudyTime(before, 'another', hour, loggedAt, '2026-11-13');
  const synced = applyStudySessionPatch(remote, patch);
  const days = studySessionsByDate(synced, '2026-11-12', '2026-11-13');

  assert.deepEqual(synced, [next[0], remote[1]]);
  assert.deepEqual(days.get('2026-11-12').map(({ duration }) => duration), [5 * hour]);
  assert.deepEqual(days.get('2026-11-13').map(({ duration }) => duration), [hour]);
  assert.equal(applyStudySessionPatch(synced, patch), synced);
  const deleted = deleteStudySession(remote, 'manual');
  assert.equal(applyStudySessionPatch(deleted, patch), deleted);
});

test('a completed timer can be corrected while an active timer is untouched', () => {
  const startedAt = timestamp('2026-11-11T23:00:00');
  const stoppedAt = timestamp('2026-11-12T02:00:00');
  const before = [{ id: 'timer', startedAt, stoppedAt }, { id: 'running', startedAt: stoppedAt, stoppedAt: null }];

  assert.equal(editStudySession(before, 'timer', 3 * hour, '2026-11-11'), before);
  assert.equal(editStudySession(before, 'running', hour, '2026-11-12'), before);
  const next = editStudySession(before, 'timer', 2 * hour, '2026-11-12');
  const synced = applyStudySessionPatch(before, diffStudySessions(before, next));
  const days = studySessionsByDate(synced, '2026-11-11', '2026-11-12');

  assert.equal(synced[1], before[1]);
  assert.equal(days.has('2026-11-11'), false);
  assert.equal(days.get('2026-11-12')[0].duration, 2 * hour);
});
