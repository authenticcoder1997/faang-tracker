export function mergeChangedStudyProgress(progress, previous, next, today) {
  const oldItems = new Map(previous.map((item) => [item.id, item]));
  const changed = next.flatMap((item) => {
    const old = oldItems.get(item.id);
    const note = item.note || '';
    const completed = !!item.completed;
    const homeworkDate = completed ? item.homeworkDate : undefined;
    const completedOn = completed ? (old?.completed ? old.completedOn : today) : undefined;
    if (old && !!old.completed === completed && (old.note || '') === note && old.homeworkDate === homeworkDate)
      return [];
    return [[item.id, {
      completed, note,
      ...(homeworkDate ? { homeworkDate } : {}),
      ...(completedOn ? { completedOn } : {}),
    }]];
  });
  return changed.length ? { ...progress, ...Object.fromEntries(changed) } : progress;
}

export function completedQuestionsByDate(progress, catalogs) {
  const days = new Map();
  for (const [track, items] of Object.entries(catalogs)) {
    for (const { id, title, url } of items) {
      const entry = progress[track]?.[id];
      if (!entry?.completed) continue;
      const date = entry.completedOn || entry.homeworkDate;
      if (!date) continue;
      if (!days.has(date)) days.set(date, []);
      days.get(date).push({ id, title, url, track, onlyHomeworkDate: !entry.completedOn });
    }
  }
  return days;
}
