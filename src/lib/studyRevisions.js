import { addDays, isValidDate } from './tasks.js';

const intervals = [1, 3, 7, 14, 30];

export function revisionDueLabel(dueDate, today) {
  // ISO calendar dates parse at UTC midnight, so DST does not affect the day count.
  const days = (Date.parse(dueDate) - Date.parse(today)) / 86_400_000;
  if (days === 0) return 'Due today';
  const count = Math.abs(days);
  const duration = `${count} ${count === 1 ? 'day' : 'days'}`;
  return days < 0 ? `${duration} overdue` : `Due in ${duration}`;
}

export function revisionTrack({ source }) {
  return source === 'lld' || source === 'hld' ? source : 'dsa';
}

export function normalizeRevision(value) {
  if (!value || typeof value.id !== 'string' || !value.id.trim() || value.id.length > 300 ||
      !isValidDate(value.dueDate) || !Number.isSafeInteger(value.reviewCount) || value.reviewCount < 0 ||
      (value.reviewedOn != null && !isValidDate(value.reviewedOn)) ||
      (value.source != null && (typeof value.source !== 'string' || value.source.length > 32)))
    throw new Error('Invalid study revision');
  return {
    id: value.id,
    dueDate: value.dueDate,
    reviewCount: value.reviewCount,
    reviewedOn: value.reviewedOn ?? null,
    source: value.source ?? null,
  };
}

export function queueRevision(revisions, id, source, today) {
  if (revisions.some((item) => item.id === id)) return revisions;
  const dueDate = revisionTrack({ source }) === 'dsa' ? addDays(today, 1) : today;
  return [...revisions, normalizeRevision({ id, source, dueDate, reviewCount: 0 })];
}

export function markRevisionReviewed(revisions, id, today) {
  return revisions.map((item) => {
    if (item.id !== id || item.reviewedOn >= today) return item;
    const delay = intervals[Math.min(item.reviewCount, intervals.length - 1)];
    return { ...item, dueDate: addDays(today, delay), reviewedOn: today, reviewCount: item.reviewCount + 1 };
  });
}
