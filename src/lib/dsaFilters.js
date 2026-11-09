import { dsaPatternsFor } from './dsaCatalog.js';

export const EMPTY_DSA_FILTERS = { query: '', statuses: [], patterns: [], difficulties: [] };

export function filterDsaProblems(items, { query, statuses, patterns, difficulties }, sources = []) {
  const text = query.trim().toLowerCase();
  return items.filter((item) => {
    const available = dsaPatternsFor(item, sources);
    const names = [item.title, ...Object.values(item.sources || {}).map(({ title }) => title), ...available];
    return (!text || names.some((name) => name?.toLowerCase().includes(text))) &&
      (!statuses.length || statuses.includes(item.completed ? 'Solved' : 'Unsolved')) &&
      (!patterns.length || patterns.some((pattern) => available.includes(pattern))) &&
      (!difficulties.length || difficulties.includes(item.difficulty));
  });
}
