export const TASK_STORAGE_KEY = 'faang-tracker-tasks-v1';
export const MAX_TASK_LINKS = 10;
export const MAX_TASK_LINK_LENGTH = 2048;

/** Normalize optional task websites before storing or rendering clickable links. */
export function normalizeTaskLinks(value) {
  if (value === undefined || value === null) return [];
  if (typeof value !== 'string' && !Array.isArray(value))
    throw new Error('Enter website links as text or a list of URLs.');
  const candidates = typeof value === 'string'
    ? value.trim().split(/\s+/).filter(Boolean)
    : value;
  const links = new Set();
  let totalLength = 0;
  for (const candidate of candidates) {
    if (typeof candidate !== 'string')
      throw new Error('Each website link must be a URL.');
    const input = candidate.trim();
    if (!input) continue;
    totalLength += input.length;
    if (input.length > MAX_TASK_LINK_LENGTH)
      throw new Error(`Keep each website link to ${MAX_TASK_LINK_LENGTH} characters or fewer.`);
    if (totalLength > MAX_TASK_LINKS * (MAX_TASK_LINK_LENGTH + 1))
      throw new Error(`Add up to ${MAX_TASK_LINKS} website links per task.`);
    if (Array.from(input).some((character) => {
      const code = character.charCodeAt(0);
      return code <= 32 || code === 127;
    }))
      throw new Error('Website links cannot contain spaces or control characters.');
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(input)
      && !/^[a-z\d.-]+:\d+(?:[/?#]|$)/i.test(input);
    if (input.startsWith('/') && !input.startsWith('//'))
      throw new Error('Use a full website address, such as https://example.com.');
    let url;
    try {
      url = new URL(hasScheme ? input : input.startsWith('//') ? `https:${input}` : `https://${input}`);
    } catch {
      throw new Error('Enter a valid website address, such as https://example.com.');
    }
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password)
      throw new Error('Use http:// or https:// website links without usernames or passwords.');
    if (!hasScheme && url.hostname !== 'localhost' && !url.hostname.startsWith('[') && !/^[a-z\d](?:[a-z\d-]*[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]*[a-z\d])?)+\.?$/i.test(url.hostname))
      throw new Error('Enter a website domain, such as example.com.');
    if (url.href.length > MAX_TASK_LINK_LENGTH)
      throw new Error(`Keep each website link to ${MAX_TASK_LINK_LENGTH} characters or fewer.`);
    links.add(url.href);
    if (links.size > MAX_TASK_LINKS)
      throw new Error(`Add up to ${MAX_TASK_LINKS} website links per task.`);
  }
  return [...links];
}

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
  const start = task.snoozedUntil > (task.dueDate || '') ? task.snoozedUntil : task.dueDate;
  if (task.repeat === 'none') return start || null;
  let candidate = start > today ? start : today;
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
    links: normalizeTaskLinks(opened.links),
  };
  const submitted = Object.hasOwn(draft, 'links')
    ? { ...draft, links: normalizeTaskLinks(draft.links) }
    : draft;
  const changed = Object.fromEntries(
    Object.keys(baseline)
      .filter((key) => Object.hasOwn(submitted, key) && (
        key === 'links'
          ? JSON.stringify(submitted.links) !== JSON.stringify(baseline.links)
          : submitted[key] !== baseline[key]
      ))
      .map((key) => [key, submitted[key]]),
  );
  if (!Object.keys(changed).length) return current;
  const next = { ...current, ...changed, updatedAt: now };
  if (current.snoozedUntil && current.snoozedUntil <= today &&
    (Object.hasOwn(changed, 'dueDate') || Object.hasOwn(changed, 'repeat')))
    next.snoozedUntil = null;
  return next.repeat === current.repeat
    ? next
    : { ...next, completed: false, completedAt: null, completedDates: [] };
}

function compareTaskRows(a, b) {
  return (a.date || '9999').localeCompare(b.date || '9999') ||
    Number(!!b.task.flagged) - Number(!!a.task.flagged) ||
    a.task.createdAt.localeCompare(b.task.createdAt);
}

export function getTaskRows(tasks, today = dateKey(), manualOrder = false) {
  const active = [];
  const snoozed = [];
  const completed = [];
  const deleted = [];
  for (const task of tasks) {
    if (task.deletedAt) {
      deleted.push({ task, date: null, key: task.id });
      continue;
    }
    const row = { task, date: nextOccurrence(task, today), key: task.id };
    if (task.repeat === 'none' && task.completed) {
      completed.push({ ...row, date: task.dueDate || null });
      continue;
    }
    (task.snoozedUntil > today ? snoozed : active).push(row);
    if (task.repeat !== 'none') {
      for (const date of task.completedDates || [])
        completed.push({ task, date, key: `${task.id}:${date}` });
    }
  }
  if (!manualOrder) active.sort(compareTaskRows);
  snoozed.sort((a, b) => a.task.snoozedUntil.localeCompare(b.task.snoozedUntil));
  completed.sort((a, b) =>
    (b.task.completedAt || b.date || '').localeCompare(
      a.task.completedAt || a.date || '',
    ),
  );
  return { active, snoozed, completed, deleted };
}

export function reorderTasks(data, visibleIds, movedId, targetId, today = dateKey()) {
  const visible = new Set(visibleIds);
  const { active, snoozed } = getTaskRows(data.tasks, today, data.manualOrder);
  const ordered = data.manualOrder ? data.tasks : [
    ...[...active, ...snoozed].sort(compareTaskRows).map(({ task }) => task),
    ...data.tasks.filter((task) => task.deletedAt || (task.repeat === 'none' && task.completed)),
  ];
  const moveable = new Set(active.filter(({ key }) => visible.has(key)).map(({ key }) => key));
  const entries = ordered.filter((task) => moveable.has(task.id));
  const from = entries.findIndex((task) => task.id === movedId);
  const to = entries.findIndex((task) => task.id === targetId);
  if (from < 0 || to < 0 || from === to) return data;
  entries.splice(to, 0, ...entries.splice(from, 1));
  let index = 0;
  return {
    ...data,
    manualOrder: true,
    tasks: ordered.map((task) => moveable.has(task.id) ? entries[index++] : task),
  };
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
    !Array.isArray(value.tasks) ||
    (value.manualOrder !== undefined && typeof value.manualOrder !== 'boolean')
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
        (task.snoozedUntil != null && !isValidDate(task.snoozedUntil)) ||
        !Array.isArray(task.completedDates) ||
        task.completedDates.some((date) => !isValidDate(date)) ||
        typeof task.createdAt !== 'string',
    )
  )
    throw new Error('Invalid tasks');
  for (const task of value.tasks) {
    if (task.links === undefined) continue;
    if (!Array.isArray(task.links)) throw new Error('Invalid task website links');
    normalizeTaskLinks(task.links);
  }
  return value;
}
