import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyStudySessionPatch, diffStudySessions, logStudyTime, normalizeStudySession, studySessionsByDate,
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
