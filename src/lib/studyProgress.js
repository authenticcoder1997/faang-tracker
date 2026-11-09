export function mergeChangedStudyProgress(progress, previous, next) {
  const oldItems = new Map(previous.map((item) => [item.id, item]));
  const changed = next.flatMap((item) => {
    const old = oldItems.get(item.id);
    const note = item.note || '';
    const completed = !!item.completed;
    if (old && !!old.completed === completed && (old.note || '') === note) return [];
    return [[item.id, { completed, note }]];
  });
  return changed.length ? { ...progress, ...Object.fromEntries(changed) } : progress;
}
