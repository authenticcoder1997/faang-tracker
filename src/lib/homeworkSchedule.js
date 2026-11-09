import { addDays } from './tasks.js';

const START_DATE = '2026-11-09';

export function buildHomeworkSchedule(dsa, lld, hld) {
  const design = [];
  for (let index = 0; index < Math.max(lld.length, hld.length); index++) {
    if (lld[index]) design.push({ track: 'lld', item: lld[index] });
    if (hld[index]) design.push({ track: 'hld', item: hld[index] });
  }

  return design.map((entry, index) => ({
    date: addDays(START_DATE, index),
    dsa: dsa.slice(
      Math.floor(index * dsa.length / design.length),
      Math.floor((index + 1) * dsa.length / design.length),
    ),
    design: entry,
  }));
}
