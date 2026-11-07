export function filterDsaProblems(items, { query, statuses, patterns, difficulties }) {
  const text = query.trim().toLowerCase();
  return items.filter((item) =>
    (!text || item.title.toLowerCase().includes(text) || item.section.toLowerCase().includes(text)) &&
    (!statuses.length || statuses.includes(item.completed ? 'Solved' : 'Unsolved')) &&
    (!patterns.length || patterns.includes(item.section)) &&
    (!difficulties.length || difficulties.includes(item.difficulty)),
  );
}
