import { addDays, isValidDate } from './tasks.js';

const intervals = [1, 3, 7, 14, 30];

export function normalizeDsaRevision(value) {
  if (!value || typeof value.id !== 'string' || !value.id.trim() || value.id.length > 300 ||
      !isValidDate(value.dueDate) || !Number.isSafeInteger(value.reviewCount) || value.reviewCount < 0 ||
      (value.reviewedOn != null && !isValidDate(value.reviewedOn)) ||
      (value.source != null && (typeof value.source !== 'string' || value.source.length > 32)))
    throw new Error('Invalid DSA revision');
  return {
    id: value.id,
    dueDate: value.dueDate,
    reviewCount: value.reviewCount,
    reviewedOn: value.reviewedOn ?? null,
    source: value.source ?? null,
  };
}

export function queueDsaRevision(revisions, id, source, today) {
  if (revisions.some((item) => item.id === id)) return revisions;
  return [...revisions, normalizeDsaRevision({ id, source, dueDate: today, reviewCount: 0 })];
}

export function reviewDsaProblem(revisions, id, today) {
  return revisions.map((item) => {
    if (item.id !== id || item.reviewedOn === today) return item;
    const delay = intervals[Math.min(item.reviewCount, intervals.length - 1)];
    return { ...item, dueDate: addDays(today, delay), reviewedOn: today, reviewCount: item.reviewCount + 1 };
  });
}
