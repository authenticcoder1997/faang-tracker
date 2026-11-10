import { addDays, isValidDate } from './tasks.js';

const START_DATE = '2026-11-09';
export const HOMEWORK_TARGET = 20;
export const DESIGN_POINTS = 10;
const EXTRA_DSA_POINTS = 10;
export const DSA_POINTS = { Easy: 1, Medium: 3, Hard: 5 };

export function homeworkPoints(track, item) {
  return track === 'dsa' ? (DSA_POINTS[item.difficulty] ?? 0) : DESIGN_POINTS;
}

// Fill as much of the budget as possible, preferring earlier sheet questions
// when several combinations reach the same score.
function selectDsa(items, budget) {
  const reachable = Array.from({ length: items.length + 1 }, () => new Set([0]));
  for (let index = items.length - 1; index >= 0; index--) {
    const points = homeworkPoints('dsa', items[index]);
    for (const score of reachable[index + 1]) {
      reachable[index].add(score);
      if (score + points <= budget) reachable[index].add(score + points);
    }
  }
  let target = Math.max(...reachable[0]);
  return items.filter((item, index) => {
    const points = homeworkPoints('dsa', item);
    if (!reachable[index + 1].has(target - points)) return false;
    target -= points;
    return true;
  });
}

export function normalizeHomeworkPlan(value) {
  if (value == null) return null;
  const validId = (id) => typeof id === 'string' && id.length > 0 && id.length <= 300;
  const { date, round, dsa, design } = value;
  if (!isValidDate(date) || !Number.isSafeInteger(round) || round < 0 ||
      !Array.isArray(dsa) || dsa.length > HOMEWORK_TARGET || !dsa.every(validId) ||
      new Set(dsa).size !== dsa.length ||
      (design !== null && (!['lld', 'hld'].includes(design?.track) || !validId(design.id))))
    throw new Error('Invalid Homework plan');
  return { date, round, dsa: [...dsa], design: design && { track: design.track, id: design.id } };
}

export function homeworkPlanFor(day) {
  return {
    date: day.date,
    round: 0,
    dsa: day.dsa.map(({ id }) => id),
    design: day.design && { track: day.design.track, id: day.design.item.id },
  };
}

export function extraHomeworkPlan(plan, dsa) {
  const batch = selectDsa(dsa.filter((item) => !item.completed && homeworkPoints('dsa', item)), EXTRA_DSA_POINTS);
  return batch.length ? { date: plan.date, round: plan.round + 1, dsa: batch.map(({ id }) => id), design: null } : null;
}

function takeSavedDesign(queues, savedDesign) {
  if (!savedDesign) return null;
  const { track, id } = savedDesign;
  const index = queues[track].findIndex((item) => item.id === id);
  return index === -1 ? null : { track, item: queues[track].splice(index, 1)[0] };
}

export function buildHomeworkSchedule(dsa, lld, hld, today, plan = null) {
  const earned = new Map();
  for (const [track, items] of [['dsa', dsa], ['lld', lld], ['hld', hld]]) {
    for (const item of items) {
      if (!item.completed || !item.homeworkDate) continue;
      const day = earned.get(item.homeworkDate) ?? { points: 0, design: false };
      day.points += homeworkPoints(track, item);
      day.design ||= track !== 'dsa';
      earned.set(item.homeworkDate, day);
    }
  }

  const schedule = new Map([...earned].map(([date, { points }]) => [
    date, { date, earned: points, dsa: [], design: null },
  ]));
  let remainingDsa = dsa.filter((item) => !item.completed && homeworkPoints('dsa', item));
  const remainingDesign = {
    lld: lld.filter((item) => !item.completed),
    hld: hld.filter((item) => !item.completed),
  };
  const firstDate = today < START_DATE ? START_DATE : today;
  let date = firstDate;

  do {
    const completed = earned.get(date);
    let budget = Math.max(0, HOMEWORK_TARGET - (completed?.points ?? 0));
    const saved = date === firstDate && plan?.date <= date ? plan : null;
    const fixed = saved?.date === date;
    let design = fixed || (!completed?.design && budget >= DESIGN_POINTS)
      ? takeSavedDesign(remainingDesign, saved?.design)
      : null;
    if (!fixed && !design && !completed?.design && budget >= DESIGN_POINTS) {
      const dayNumber = (Date.parse(date) - Date.parse(START_DATE)) / 86400000;
      const [first, second] = dayNumber % 2 ? ['hld', 'lld'] : ['lld', 'hld'];
      const track = remainingDesign[first].length ? first : second;
      const item = remainingDesign[track].shift();
      if (item) {
        design = { track, item };
      }
    }

    if (design) budget -= DESIGN_POINTS;
    const savedIds = new Set(saved?.dsa);
    const savedDsa = saved?.dsa.map((id) => remainingDsa.find((item) => item.id === id)).filter(Boolean) ?? [];
    const carried = fixed ? savedDsa : selectDsa(savedDsa, budget);
    const carriedPoints = carried.reduce((sum, item) => sum + homeworkPoints('dsa', item), 0);
    const assignedDsa = fixed ? carried : [
      ...carried,
      ...selectDsa(remainingDsa.filter((item) => !savedIds.has(item.id)), budget - carriedPoints),
    ];
    const assignedIds = new Set(assignedDsa.map((item) => item.id));
    remainingDsa = remainingDsa.filter((item) => !assignedIds.has(item.id));
    schedule.set(date, { date, earned: completed?.points ?? 0, dsa: assignedDsa, design });
    date = addDays(date, 1);
  } while (remainingDsa.length || remainingDesign.lld.length || remainingDesign.hld.length);

  return [...schedule.values()].sort((first, second) => first.date.localeCompare(second.date));
}
