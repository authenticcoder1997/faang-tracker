import assert from 'node:assert/strict';
import test from 'node:test';
import { lldTopics } from '../data/lldTopics.js';
import { hldTopics } from '../data/hldTopics.js';
import { striverDsaTopics } from './dsaPlan.js';
import { buildHomeworkSchedule } from './homeworkSchedule.js';

test('Homework schedules the entire sheet and exactly one design exercise each day', () => {
  const schedule = buildHomeworkSchedule(striverDsaTopics, lldTopics, hldTopics);
  assert.equal(schedule.length, 80);
  assert.equal(schedule[0].date, '2026-11-09');
  assert.equal(schedule.at(-1).date, '2027-01-27');
  assert.equal(new Set(schedule.map(({ date }) => date)).size, schedule.length);
  assert.ok(schedule.every(({ dsa }) => dsa.length === 2 || dsa.length === 3));
  assert.deepEqual(schedule.flatMap(({ dsa }) => dsa), striverDsaTopics);
  assert.deepEqual(schedule.slice(0, 4).map(({ design }) => design.track), ['lld', 'hld', 'lld', 'hld']);
  assert.deepEqual(schedule.filter(({ design }) => design.track === 'lld').map(({ design }) => design.item), lldTopics);
  assert.deepEqual(schedule.filter(({ design }) => design.track === 'hld').map(({ design }) => design.item), hldTopics);
});
