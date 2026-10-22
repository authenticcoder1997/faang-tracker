export const TASK_STORAGE_KEY = 'faang-tracker-tasks-v1';
export const REPEAT_OPTIONS = [
  { value: 'none', label: 'No repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays', detail: 'Monday–Friday' },
  { value: 'weekends', label: 'Weekends', detail: 'Saturday & Sunday' },
];
export const LIST_COLORS = [
  '#60a5fa',
  '#fb923c',
  '#c084fc',
  '#4ade80',
  '#f472b6',
  '#facc15',
];
export const INITIAL_TASK_DATA = {
  version: 1,
  lists: [
    { id: 'personal', name: 'Personal', color: LIST_COLORS[0] },
    { id: 'work', name: 'Work', color: LIST_COLORS[1] },
    { id: 'learning', name: 'Learning', color: LIST_COLORS[2] },
  ],
  tasks: [],
};

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDays(key, amount) {
  const [year, month, day] = key.split('-').map(Number);
  return dateKey(new Date(year, month - 1, day + amount, 12));
}

export function isValidDate(key) {
  return (
    typeof key === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(key) &&
    addDays(key, 0) === key
  );
}

function eligibleDay(key, repeat) {
  const [year, month, day] = key.split('-').map(Number);
  const weekday = new Date(year, month - 1, day, 12).getDay();
  return repeat === 'weekdays'
    ? weekday > 0 && weekday < 6
    : repeat === 'weekends'
      ? weekday === 0 || weekday === 6
      : true;
}

export function nextOccurrence(task, today = dateKey()) {
  if (task.repeat === 'none') return task.dueDate || null;
  let candidate = (task.dueDate || today) > today ? task.dueDate : today;
  const completed = new Set(task.completedDates || []);
  while (!eligibleDay(candidate, task.repeat) || completed.has(candidate))
    candidate = addDays(candidate, 1);
  return candidate;
}

export function completeTask(
  task,
  occurrenceDate,
  now = new Date().toISOString(),
) {
  if (task.repeat === 'none')
    return {
      ...task,
      completed: !task.completed,
      completedAt: task.completed ? null : now,
      updatedAt: now,
    };
  const dates = task.completedDates || [];
  return {
    ...task,
    completedDates: dates.includes(occurrenceDate)
      ? dates.filter((date) => date !== occurrenceDate)
      : [...dates, occurrenceDate].sort(),
    updatedAt: now,
  };
}

// An editor may remain open while another device changes the same task. Merge
// only the form fields changed from its opening snapshot into the latest task.
export function mergeTaskEdits(current, opened, draft, now, today = dateKey()) {
  if (!current || current.id !== opened?.id || current.deletedAt) return null;
  const baseline = {
    title: opened.title.trim(),
    notes: (opened.notes || '').trim(),
    listId: opened.listId,
    dueDate: opened.dueDate || (opened.repeat !== 'none' ? today : null),
    repeat: opened.repeat,
    flagged: !!opened.flagged,
  };
  const changed = Object.fromEntries(
    Object.keys(baseline)
      .filter((key) => Object.hasOwn(draft, key) && draft[key] !== baseline[key])
      .map((key) => [key, draft[key]]),
  );
  if (!Object.keys(changed).length) return current;
  const next = { ...current, ...changed, updatedAt: now };
  return next.repeat === current.repeat
    ? next
    : { ...next, completed: false, completedAt: null, completedDates: [] };
}

export function getTaskRows(tasks, today = dateKey()) {
  const active = [];
  const completed = [];
  const deleted = [];
  for (const task of tasks) {
    if (task.deletedAt) {
      deleted.push({ task, date: null, key: task.id });
      continue;
    }
    if (task.repeat === 'none') {
      const row = { task, date: task.dueDate || null, key: task.id };
      (task.completed ? completed : active).push(row);
    } else {
      active.push({ task, date: nextOccurrence(task, today), key: task.id });
      for (const date of task.completedDates || [])
        completed.push({ task, date, key: `${task.id}:${date}` });
    }
  }
  active.sort(
    (a, b) =>
      (a.date || '9999').localeCompare(b.date || '9999') ||
      Number(b.task.flagged) - Number(a.task.flagged) ||
      a.task.createdAt.localeCompare(b.task.createdAt),
  );
  completed.sort((a, b) =>
    (b.task.completedAt || b.date || '').localeCompare(
      a.task.completedAt || a.date || '',
    ),
  );
  return { active, completed, deleted };
}

export function deleteTaskList(data, listId, destinationId, inboxId) {
  const index = data.lists.findIndex((list) => list.id === listId);
  if (index < 0) return null;
  const list = data.lists[index];
  const lists = data.lists.filter((item) => item.id !== listId);
  const taskIds = data.tasks
    .filter((task) => task.listId === listId)
    .map((task) => task.id);
  let destination = lists.find((item) => item.id === destinationId);
  let inbox = null;
  if (taskIds.length && !lists.length) {
    if (!inboxId || inboxId === listId) return null;
    inbox = { id: inboxId, name: 'Inbox', color: LIST_COLORS[0] };
    destination = inbox;
    lists.push(inbox);
  }
  if (taskIds.length && !destination) return null;
  return {
    list,
    index,
    taskIds,
    inbox,
    destinationId: destination?.id,
    data: {
      ...data,
      lists,
      tasks: data.tasks.map((task) =>
        task.listId === listId ? { ...task, listId: destination.id } : task,
      ),
    },
  };
}

export function restoreTaskList(data, removal) {
  if (data.lists.some((list) => list.id === removal.list.id)) return data;
  const moved = new Set(removal.taskIds);
  const tasks = data.tasks.map((task) =>
    moved.has(task.id) && task.listId === removal.destinationId
      ? { ...task, listId: removal.list.id }
      : task,
  );
  const lists = [...data.lists];
  lists.splice(Math.min(removal.index, lists.length), 0, removal.list);
  return {
    ...data,
    tasks,
    lists: lists.filter(
      (list) =>
        !removal.inbox ||
        list.id !== removal.inbox.id ||
        tasks.some((task) => task.listId === list.id) ||
        list.name !== removal.inbox.name ||
        list.color !== removal.inbox.color,
    ),
  };
}

export function validateTaskData(value) {
  if (
    value?.version !== 1 ||
    !Array.isArray(value.lists) ||
    !Array.isArray(value.tasks)
  )
    throw new Error('Unrecognized task data');
  if (
    value.lists.some(
      (list) =>
        typeof list.id !== 'string' ||
        typeof list.name !== 'string' ||
        !/^#[a-f\d]{6}$/i.test(list.color),
    )
  )
    throw new Error('Invalid lists');
  const listIds = new Set(value.lists.map((list) => list.id));
  if (
    value.tasks.some(
      (task) =>
        typeof task.id !== 'string' ||
        typeof task.title !== 'string' ||
        !listIds.has(task.listId) ||
        !REPEAT_OPTIONS.some((option) => option.value === task.repeat) ||
        (task.dueDate && !isValidDate(task.dueDate)) ||
        !Array.isArray(task.completedDates) ||
        task.completedDates.some((date) => !isValidDate(date)) ||
        typeof task.createdAt !== 'string',
    )
  )
    throw new Error('Invalid tasks');
  return value;
}
