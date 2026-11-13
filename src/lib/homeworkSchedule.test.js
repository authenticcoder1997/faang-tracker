import assert from 'node:assert/strict';
import test from 'node:test';
import { lldTopics } from '../data/lldTopics.js';
import { hldTopics } from '../data/hldTopics.js';
import { striverDsaTopics } from './dsaPlan.js';
import {
  buildHomeworkSchedule, DESIGN_POINTS, extraHomeworkPlan, homeworkPlanFor, homeworkPoints,
  HOMEWORK_TARGET, normalizeHomeworkPlan,
} from './homeworkSchedule.js';

const today = '2026-11-09';
const planned = ({ dsa, designs }) => dsa.reduce(
  (points, item) => points + homeworkPoints('dsa', item), designs.length * DESIGN_POINTS,
);
const ids = (items) => items.map((item) => item.id);

test('the sheet is scheduled without repeats, completed problems, or days over the points target', () => {
  const schedule = buildHomeworkSchedule(striverDsaTopics, lldTopics, hldTopics, today);
  const allDsa = schedule.flatMap((day) => day.dsa);
  assert.equal(schedule[0].date, today);
  assert.equal(planned(schedule[0]), HOMEWORK_TARGET);
  assert.deepEqual(schedule.slice(0, 4).map((day) => day.designs[0].track), ['lld', 'hld', 'lld', 'hld']);
  for (const day of schedule) {
    const weekend = [0, 6].includes(new Date(day.date).getUTCDay());
    assert.ok(day.designs.length <= (weekend ? 2 : 1));
    assert.ok(planned(day) > 0 && planned(day) <= HOMEWORK_TARGET +
      (day.designs.length === 2 ? DESIGN_POINTS : 0));
  }
  assert.deepEqual(ids(allDsa).sort(), ids(striverDsaTopics.filter((item) => !item.completed)).sort());
  const designs = schedule.flatMap((day) => day.designs);
  assert.deepEqual(designs.filter(({ track }) => track === 'lld').map(({ item }) => item), lldTopics);
  assert.deepEqual(designs.filter(({ track }) => track === 'hld').map(({ item }) => item), hldTopics);
});

test('completed Homework earns points for its date and leaves only the rest of the same agenda', () => {
  const [first] = buildHomeworkSchedule(striverDsaTopics, lldTopics, hldTopics, today);
  const completedDsa = first.dsa[0];
  const withDsa = striverDsaTopics.map((item) => item.id === completedDsa.id
    ? { ...item, completed: true, homeworkDate: today }
    : item);
  const withLld = lldTopics.map((item) => item.id === first.designs[0].item.id
    ? { ...item, completed: true, homeworkDate: today }
    : item);
  const [partial] = buildHomeworkSchedule(withDsa, withLld, hldTopics, today);
  assert.equal(partial.earned, DESIGN_POINTS + homeworkPoints('dsa', completedDsa));
  assert.deepEqual(partial.designs, []);
  assert.deepEqual(ids(partial.dsa), ids(first.dsa.slice(1)));
  assert.equal(partial.earned + planned(partial), HOMEWORK_TARGET);

  const finishedIds = new Set(ids(first.dsa));
  const allDone = withDsa.map((item) => finishedIds.has(item.id)
    ? { ...item, completed: true, homeworkDate: today }
    : item);
  const schedule = buildHomeworkSchedule(allDone, withLld, hldTopics, '2026-11-10');
  assert.deepEqual(schedule[0], { date: today, earned: HOMEWORK_TARGET, dsa: [], designs: [] });
  assert.equal(schedule[1].designs[0].track, 'hld');
  assert.equal(planned(schedule[1]), HOMEWORK_TARGET);
});

test('when an exact fit is unavailable, the agenda uses the largest score below the target', () => {
  const medium = Array.from({ length: 4 }, (_, i) => ({ id: `medium-${i}`, difficulty: 'Medium' }));
  const schedule = buildHomeworkSchedule(medium, lldTopics.slice(0, 1), [], today);
  assert.deepEqual(ids(schedule[0].dsa), ids(medium.slice(0, 3)));
  assert.equal(planned(schedule[0]), 19);
  assert.equal(planned(schedule[1]), 3);
});

test('a saved day stays fixed and unfinished assignments carry forward before new work', () => {
  const [first] = buildHomeworkSchedule(striverDsaTopics, lldTopics, hldTopics, today);
  const plan = homeworkPlanFor(first);
  const doneId = first.dsa[0].id;
  const remaining = striverDsaTopics.map((item) => item.id === doneId
    ? { ...item, completed: true, homeworkDate: today }
    : item);
  const [sameDay] = buildHomeworkSchedule(remaining, lldTopics, hldTopics, today, plan);
  assert.deepEqual(ids(sameDay.dsa), plan.dsa.filter((id) => id !== doneId));
  const tomorrow = buildHomeworkSchedule(remaining, lldTopics, hldTopics, '2026-11-10', plan)[1];
  assert.equal(tomorrow.date, '2026-11-10');
  assert.equal(tomorrow.designs[0].item.id, plan.design.id);
  assert.deepEqual(ids(tomorrow.dsa).slice(0, sameDay.dsa.length), ids(sameDay.dsa));
  assert.equal(planned(tomorrow), HOMEWORK_TARGET);
});

test('extra work adds a bounded DSA batch without changing the normal schedule', () => {
  const [first] = buildHomeworkSchedule(striverDsaTopics, lldTopics, hldTopics, today);
  const plan = homeworkPlanFor(first);
  const done = new Set(plan.dsa);
  const dsa = striverDsaTopics.map((item) => done.has(item.id) ? { ...item, completed: true, homeworkDate: today } : item);
  const lld = lldTopics.map((item) => item.id === plan.design.id ? { ...item, completed: true, homeworkDate: today } : item);
  const extra = extraHomeworkPlan(plan, dsa);
  assert.equal(extra.round, 1);
  assert.ok(extra.dsa.every((id) => !done.has(id)));
  const [withExtra, next] = buildHomeworkSchedule(dsa, lld, hldTopics, today, extra);
  assert.equal(withExtra.earned, HOMEWORK_TARGET);
  assert.equal(planned(withExtra), 10);
  assert.deepEqual(withExtra.designs, []);
  assert.equal(planned(next), HOMEWORK_TARGET);
});

test('Saturday and Sunday each get one LLD and one HLD exercise alongside the usual DSA load', () => {
  const weekend = buildHomeworkSchedule(striverDsaTopics, lldTopics, hldTopics, '2026-11-14');
  for (const day of weekend.slice(0, 2)) {
    assert.deepEqual(day.designs.map(({ track }) => track), ['lld', 'hld']);
    assert.equal(planned(day), HOMEWORK_TARGET + DESIGN_POINTS);
    assert.deepEqual(normalizeHomeworkPlan(homeworkPlanFor(day)), homeworkPlanFor(day));
  }
  assert.equal(weekend[2].designs.length, 1);
  assert.equal(planned(weekend[2]), HOMEWORK_TARGET);
});

test('an existing Saturday plan keeps its assignments and adds the missing design track once', () => {
  const saturday = '2026-11-14';
  const savedDsa = striverDsaTopics.find((item) => !item.completed);
  const saved = { date: saturday, round: 0, dsa: [savedDsa.id],
    design: { track: 'hld', id: hldTopics[0].id } };
  const completedHld = hldTopics.map((item, index) => index === 0
    ? { ...item, completed: true, homeworkDate: saturday } : item);
  const [upgraded] = buildHomeworkSchedule(striverDsaTopics, lldTopics, completedHld, saturday, saved);
  assert.deepEqual(ids(upgraded.dsa), saved.dsa);
  assert.deepEqual(upgraded.designs.map(({ track }) => track), ['lld']);
  const plan = homeworkPlanFor(upgraded, saved);
  assert.deepEqual(plan.weekendDesigns, [saved.design, { track: 'lld', id: lldTopics[0].id }]);
  assert.deepEqual(normalizeHomeworkPlan(plan), plan);
  assert.equal(homeworkPlanFor(upgraded, plan), plan);

  const [, sunday] = buildHomeworkSchedule(striverDsaTopics, lldTopics, completedHld, '2026-11-15', plan);
  assert.equal(sunday.date, '2026-11-15');
  assert.deepEqual(sunday.designs.map(({ item }) => item.id), [lldTopics[0].id, hldTopics[1].id]);
});
