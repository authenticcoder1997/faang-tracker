import { addDays } from './tasks.js';

const START_DATE = '2026-11-09';
export const HOMEWORK_TARGET = 15;
export const DESIGN_POINTS = 5;
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

export function buildHomeworkSchedule(dsa, lld, hld, today) {
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
  let date = today < START_DATE ? START_DATE : today;

  do {
    const completed = earned.get(date);
    let budget = Math.max(0, HOMEWORK_TARGET - (completed?.points ?? 0));
    let design = null;
    if (!completed?.design && budget >= DESIGN_POINTS) {
      const dayNumber = (Date.parse(date) - Date.parse(START_DATE)) / 86400000;
      const [first, second] = dayNumber % 2 ? ['hld', 'lld'] : ['lld', 'hld'];
      const track = remainingDesign[first].length ? first : second;
      const item = remainingDesign[track].shift();
      if (item) {
        design = { track, item };
        budget -= DESIGN_POINTS;
      }
    }

    const assignedDsa = selectDsa(remainingDsa, budget);
    const assignedIds = new Set(assignedDsa.map((item) => item.id));
    remainingDsa = remainingDsa.filter((item) => !assignedIds.has(item.id));
    schedule.set(date, { date, earned: completed?.points ?? 0, dsa: assignedDsa, design });
    date = addDays(date, 1);
  } while (remainingDsa.length || remainingDesign.lld.length || remainingDesign.hld.length);

  return [...schedule.values()].sort((first, second) => first.date.localeCompare(second.date));
}
