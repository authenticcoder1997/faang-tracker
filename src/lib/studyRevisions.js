import { addDays, isValidDate } from './tasks.js';

export const DEFAULT_REVISION_DELAY_DAYS = 2;
const intervals = [DEFAULT_REVISION_DELAY_DAYS, 3, 7, 14, 30];

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
  return scheduleRevision(revisions, id, source, addDays(today, DEFAULT_REVISION_DELAY_DAYS));
}

export function scheduleRevision(revisions, id, source, dueDate) {
  const existing = revisions.find((item) => item.id === id);
  if (existing && existing.dueDate === dueDate) return revisions;
  const scheduled = normalizeRevision({ id, source, reviewCount: 0, ...existing, dueDate });
  return existing ? revisions.map((item) => item === existing ? scheduled : item) : [...revisions, scheduled];
}

export function markRevisionReviewed(revisions, id, today) {
  return revisions.map((item) => {
    if (item.id !== id || item.reviewedOn >= today) return item;
    const delay = intervals[Math.min(item.reviewCount, intervals.length - 1)];
    return { ...item, dueDate: addDays(today, delay), reviewedOn: today, reviewCount: item.reviewCount + 1 };
  });
}

export function deferRevision(revisions, id, source, until) {
  const revision = revisions.find((item) => item.id === id);
  if (revision?.dueDate >= until) return revisions;
  return scheduleRevision(revisions, id, source, until);
}
