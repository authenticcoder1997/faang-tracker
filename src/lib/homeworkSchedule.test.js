import assert from 'node:assert/strict';
import test from 'node:test';
import { lldTopics } from '../data/lldTopics.js';
import { hldTopics } from '../data/hldTopics.js';
import { striverDsaTopics } from './dsaPlan.js';
import { buildHomeworkSchedule, homeworkPoints, HOMEWORK_TARGET } from './homeworkSchedule.js';

const today = '2026-11-09';
const planned = ({ dsa, design }) => dsa.reduce(
  (points, item) => points + homeworkPoints('dsa', item), design ? 5 : 0,
);
const ids = (items) => items.map((item) => item.id);

test('the sheet is scheduled without repeats, completed problems, or days over the points target', () => {
  const schedule = buildHomeworkSchedule(striverDsaTopics, lldTopics, hldTopics, today);
  const allDsa = schedule.flatMap((day) => day.dsa);
  assert.equal(schedule[0].date, today);
  assert.equal(planned(schedule[0]), HOMEWORK_TARGET);
  assert.deepEqual(schedule.slice(0, 4).map((day) => day.design.track), ['lld', 'hld', 'lld', 'hld']);
  assert.ok(schedule.every((day) => planned(day) > 0 && planned(day) <= HOMEWORK_TARGET));
  assert.deepEqual(ids(allDsa).sort(), ids(striverDsaTopics.filter((item) => !item.completed)).sort());
  assert.deepEqual(schedule.filter((day) => day.design?.track === 'lld').map((day) => day.design.item), lldTopics);
  assert.deepEqual(schedule.filter((day) => day.design?.track === 'hld').map((day) => day.design.item), hldTopics);
});

test('completed Homework earns points for its date and leaves only the rest of the same agenda', () => {
  const [first] = buildHomeworkSchedule(striverDsaTopics, lldTopics, hldTopics, today);
  const completedDsa = first.dsa[0];
  const withDsa = striverDsaTopics.map((item) => item.id === completedDsa.id
    ? { ...item, completed: true, homeworkDate: today }
    : item);
  const withLld = lldTopics.map((item) => item.id === first.design.item.id
    ? { ...item, completed: true, homeworkDate: today }
    : item);
  const [partial] = buildHomeworkSchedule(withDsa, withLld, hldTopics, today);
  assert.equal(partial.earned, 5 + homeworkPoints('dsa', completedDsa));
  assert.equal(partial.design, null);
  assert.deepEqual(ids(partial.dsa), ids(first.dsa.slice(1)));
  assert.equal(partial.earned + planned(partial), HOMEWORK_TARGET);

  const finishedIds = new Set(ids(first.dsa));
  const allDone = withDsa.map((item) => finishedIds.has(item.id)
    ? { ...item, completed: true, homeworkDate: today }
    : item);
  const schedule = buildHomeworkSchedule(allDone, withLld, hldTopics, '2026-11-10');
  assert.deepEqual(schedule[0], { date: today, earned: HOMEWORK_TARGET, dsa: [], design: null });
  assert.equal(schedule[1].design.track, 'hld');
  assert.equal(planned(schedule[1]), HOMEWORK_TARGET);
});

test('when an exact fit is unavailable, the agenda uses the largest score below the target', () => {
  const medium = Array.from({ length: 4 }, (_, i) => ({ id: `medium-${i}`, difficulty: 'Medium' }));
  const schedule = buildHomeworkSchedule(medium, lldTopics.slice(0, 1), [], today);
  assert.deepEqual(ids(schedule[0].dsa), ids(medium.slice(0, 3)));
  assert.equal(planned(schedule[0]), 14);
  assert.equal(planned(schedule[1]), 3);
});
