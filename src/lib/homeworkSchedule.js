import { addDays, isValidDate } from './tasks.js';

const START_DATE = '2026-11-09';
export const HOMEWORK_TARGET = 20;
export const DESIGN_POINTS = 10;
const EXTRA_DSA_POINTS = 10;
const DESIGN_TRACKS = ['lld', 'hld'];
export const DSA_POINTS = { Easy: 1, Medium: 3, Hard: 5 };

function isWeekend(date) {
  const day = new Date(date).getUTCDay();
  return day === 0 || day === 6;
}

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
  const validDesign = (item) => DESIGN_TRACKS.includes(item?.track) && validId(item.id);
  const copyDesign = ({ track, id }) => ({ track, id });
  const { date, round, dsa, design, weekendDesigns } = value;
  if (!isValidDate(date) || !Number.isSafeInteger(round) || round < 0 ||
      !Array.isArray(dsa) || dsa.length > HOMEWORK_TARGET || !dsa.every(validId) ||
      new Set(dsa).size !== dsa.length ||
      (design !== null && !validDesign(design)) ||
      (weekendDesigns !== undefined && (!isWeekend(date) || !Array.isArray(weekendDesigns) ||
        weekendDesigns.length > DESIGN_TRACKS.length || !weekendDesigns.every(validDesign) ||
        new Set(weekendDesigns.map(({ track }) => track)).size !== weekendDesigns.length ||
        (design && !weekendDesigns.some(({ track, id }) => track === design.track && id === design.id)))))
    throw new Error('Invalid Homework plan');
  return {
    date, round, dsa: [...dsa], design: design && copyDesign(design),
    ...(weekendDesigns !== undefined ? { weekendDesigns: weekendDesigns.map(copyDesign) } : {}),
  };
}

function savedDesigns(plan) {
  return plan?.weekendDesigns ?? (plan?.design ? [plan.design] : []);
}

export function homeworkPlanFor(day, saved = null) {
  const weekend = isWeekend(day.date);
  if (saved?.date > day.date || (saved?.date === day.date && (!weekend || saved.weekendDesigns))) return saved;
  const designs = day.designs.map(({ track, item }) => ({ track, id: item.id }));
  if (saved?.date === day.date) {
    const weekendDesigns = saved.design
      ? [saved.design, ...designs.filter(({ track }) => track !== saved.design.track)]
      : designs;
    return { ...saved, weekendDesigns };
  }
  return {
    date: day.date,
    round: 0,
    dsa: day.dsa.map(({ id }) => id),
    design: designs[0] ?? null,
    ...(weekend ? { weekendDesigns: designs } : {}),
  };
}

export function extraHomeworkPlan(plan, dsa) {
  const batch = selectDsa(dsa.filter((item) => !item.completed && homeworkPoints('dsa', item)), EXTRA_DSA_POINTS);
  return batch.length ? {
    date: plan.date,
    round: plan.round + 1,
    dsa: batch.map(({ id }) => id),
    design: null,
    ...(isWeekend(plan.date) ? { weekendDesigns: [] } : {}),
  } : null;
}

function takeSavedDesign(queues, design) {
  if (!design) return null;
  const { track, id } = design;
  const index = queues[track].findIndex((item) => item.id === id);
  return index === -1 ? null : { track, item: queues[track].splice(index, 1)[0] };
}

function assignDesigns(queues, date, completedTracks, fixedPlan, carry, budget) {
  const weekend = isWeekend(date);
  const fixedDesigns = savedDesigns(fixedPlan);
  const assigned = fixedDesigns.map((design) => takeSavedDesign(queues, design)).filter(Boolean);
  if (fixedPlan && (!weekend || fixedPlan.weekendDesigns)) return assigned;

  if (weekend) {
    const occupied = new Set([...completedTracks, ...fixedDesigns.map(({ track }) => track)]);
    for (const track of DESIGN_TRACKS) {
      if (occupied.has(track)) continue;
      const carried = takeSavedDesign(queues, carry.find((design) => design.track === track));
      if (carried) assigned.push(carried);
      else if (queues[track].length) assigned.push({ track, item: queues[track].shift() });
    }
    return assigned;
  }

  if (completedTracks.size || budget < DESIGN_POINTS) return [];
  for (const design of carry) {
    const carried = takeSavedDesign(queues, design);
    if (carried) return [carried];
  }
  const dayNumber = (Date.parse(date) - Date.parse(START_DATE)) / 86400000;
  const [first, second] = dayNumber % 2 ? ['hld', 'lld'] : DESIGN_TRACKS;
  const track = queues[first].length ? first : second;
  return queues[track].length ? [{ track, item: queues[track].shift() }] : [];
}

export function buildHomeworkSchedule(dsa, lld, hld, today, plan = null) {
  const earned = new Map();
  for (const [track, items] of [['dsa', dsa], ['lld', lld], ['hld', hld]]) {
    for (const item of items) {
      if (!item.completed || !item.homeworkDate) continue;
      const day = earned.get(item.homeworkDate) ?? { points: 0, designTracks: new Set() };
      day.points += homeworkPoints(track, item);
      if (track !== 'dsa') day.designTracks.add(track);
      earned.set(item.homeworkDate, day);
    }
  }

  const schedule = new Map([...earned].map(([date, { points }]) => [
    date, { date, earned: points, dsa: [], designs: [] },
  ]));
  let remainingDsa = dsa.filter((item) => !item.completed && homeworkPoints('dsa', item));
  const remainingDesign = {
    lld: lld.filter((item) => !item.completed),
    hld: hld.filter((item) => !item.completed),
  };
  const firstDate = today < START_DATE ? START_DATE : today;
  const carryDesigns = plan?.date < firstDate ? savedDesigns(plan) : [];
  let date = firstDate;

  do {
    const completed = earned.get(date);
    const completedTracks = completed?.designTracks ?? new Set();
    const earnedPoints = completed?.points ?? 0;
    const saved = date === firstDate && plan?.date <= date ? plan : null;
    const fixed = saved?.date === date;
    const designs = assignDesigns(remainingDesign, date, completedTracks, fixed ? saved : null,
      carryDesigns, HOMEWORK_TARGET - earnedPoints);
    const designTracks = new Set([...completedTracks, ...designs.map(({ track }) => track)]);
    // A second weekend design exercise adds to the day without using the DSA budget.
    const target = HOMEWORK_TARGET + (isWeekend(date) && designTracks.size === 2 ? DESIGN_POINTS : 0);
    const budget = Math.max(0, target - earnedPoints - designs.length * DESIGN_POINTS);
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
    schedule.set(date, { date, earned: earnedPoints, dsa: assignedDsa, designs });
    date = addDays(date, 1);
  } while (remainingDsa.length || remainingDesign.lld.length || remainingDesign.hld.length);

  return [...schedule.values()].sort((first, second) => first.date.localeCompare(second.date));
}
