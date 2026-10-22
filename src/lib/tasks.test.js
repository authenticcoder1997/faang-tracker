import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  completeTask,
  dateKey,
  deleteTaskList,
  getTaskRows,
  INITIAL_TASK_DATA,
  isValidDate,
  mergeTaskEdits,
  nextOccurrence,
  restoreTaskList,
  validateTaskData,
} from './tasks.js';

const task = (overrides = {}) => ({
  id: 'task-1',
  title: 'Read',
  listId: 'personal',
  dueDate: '2026-10-21',
  repeat: 'none',
  completed: false,
  completedDates: [],
  flagged: false,
  createdAt: '2026-10-21T04:00:00Z',
  ...overrides,
});

test('dates follow the local calendar across month and year boundaries', () => {
  assert.equal(dateKey(new Date(2026, 9, 21, 0, 30)), '2026-10-21');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(isValidDate('2026-02-30'), false);
});

test('weekday tasks roll from Friday to Monday; weekend tasks roll from Sunday to Saturday', () => {
  const weekday = completeTask(task({ repeat: 'weekdays' }), '2026-10-23');
  assert.equal(nextOccurrence(weekday, '2026-10-23'), '2026-10-26');
  assert.equal(
    nextOccurrence(task({ repeat: 'weekdays' }), '2026-10-24'),
    '2026-10-26',
  );
  const weekend = completeTask(task({ repeat: 'weekends' }), '2026-10-25');
  assert.equal(nextOccurrence(weekend, '2026-10-25'), '2026-10-31');
  assert.equal(
    nextOccurrence(task({ repeat: 'weekends' }), '2026-10-21'),
    '2026-10-24',
  );
});

test('daily completion advances once, persists through serialization, and supports undo', () => {
  const done = completeTask(task({ repeat: 'daily' }), '2026-10-21');
  const restored = JSON.parse(JSON.stringify(done));
  assert.equal(nextOccurrence(restored, '2026-10-21'), '2026-10-22');
  assert.equal(
    nextOccurrence(completeTask(restored, '2026-10-21'), '2026-10-21'),
    '2026-10-21',
  );
  assert.equal(nextOccurrence(restored, '2026-10-24'), '2026-10-24');
});

test('future start dates are respected and normalized to eligible repeat days', () => {
  assert.equal(
    nextOccurrence(
      task({ repeat: 'daily', dueDate: '2026-11-01' }),
      '2026-10-21',
    ),
    '2026-11-01',
  );
  assert.equal(
    nextOccurrence(
      task({ repeat: 'weekdays', dueDate: '2026-10-24' }),
      '2026-10-21',
    ),
    '2026-10-26',
  );
});

test('no-repeat tasks complete once; deleted tasks stay recoverable without appearing in active lists', () => {
  const done = completeTask(task(), null, '2026-10-21T06:00:00Z');
  assert.equal(done.completed, true);
  const rows = getTaskRows(
    [
      done,
      task({ id: 'deleted', deletedAt: '2026-10-21' }),
      task({ id: 'unscheduled', dueDate: null }),
    ],
    '2026-10-21',
  );
  assert.equal(rows.active[0].task.id, 'unscheduled');
  assert.equal(rows.completed.length, 1);
  assert.equal(rows.deleted.length, 1);
  assert.equal(completeTask(done).completed, false);
});

test('recurring completion history is separate from the next active occurrence', () => {
  const rows = getTaskRows(
    [task({ repeat: 'daily', completedDates: ['2026-10-20', '2026-10-21'] })],
    '2026-10-21',
  );
  assert.equal(rows.active[0].date, '2026-10-22');
  assert.deepEqual(
    rows.completed.map((row) => row.date),
    ['2026-10-21', '2026-10-20'],
  );
});

const editorDraft = (value, today = '2026-10-21') => ({
  title: value.title.trim(),
  notes: (value.notes || '').trim(),
  listId: value.listId,
  dueDate: value.dueDate || (value.repeat !== 'none' ? today : null),
  repeat: value.repeat,
  flagged: !!value.flagged,
});

test('saving only a title preserves a recurring completion made while the editor was open', () => {
  const opened = task({ repeat: 'daily' });
  const latest = completeTask(opened, '2026-10-21');
  const saved = mergeTaskEdits(latest, opened, { ...editorDraft(opened), title: 'Renamed task' }, '2026-10-21T06:00:00Z', '2026-10-21');
  assert.equal(saved.title, 'Renamed task');
  assert.deepEqual(saved.completedDates, ['2026-10-21']);
  assert.equal(nextOccurrence(saved, '2026-10-21'), '2026-10-22');
  const rows = getTaskRows([saved], '2026-10-21');
  assert.equal(rows.completed.length, 1);
  assert.equal(rows.active[0].date, '2026-10-22');
});

test('saving task notes retains newer completion, title, flag, schedule and list changes', () => {
  const opened = task({ notes: 'Opening notes' });
  const latest = {
    ...completeTask(opened, null, '2026-10-21T05:00:00Z'),
    title: 'Phone title',
    flagged: true,
    dueDate: '2026-10-25',
    listId: 'work',
  };
  const before = structuredClone(latest);
  const saved = mergeTaskEdits(latest, opened, { ...editorDraft(opened), notes: 'Laptop notes' }, '2026-10-21T06:00:00Z', '2026-10-21');
  assert.equal(saved.notes, 'Laptop notes');
  assert.equal(saved.title, 'Phone title');
  assert.equal(saved.flagged, true);
  assert.equal(saved.dueDate, '2026-10-25');
  assert.equal(saved.listId, 'work');
  assert.equal(saved.completed, true);
  assert.equal(saved.completedAt, '2026-10-21T05:00:00Z');
  assert.deepEqual(latest, before);
});

test('unchanged form repeat/date fields retain a remote repeat change and newer history', () => {
  const opened = task({ repeat: 'daily', dueDate: null });
  const latest = { ...opened, repeat: 'weekdays', dueDate: '2026-11-02', completedDates: ['2026-10-21'] };
  const saved = mergeTaskEdits(latest, opened, { ...editorDraft(opened), title: 'New title' }, '2026-10-21T06:00:00Z', '2026-10-21');
  assert.equal(saved.repeat, 'weekdays');
  assert.equal(saved.dueDate, '2026-11-02');
  assert.deepEqual(saved.completedDates, ['2026-10-21']);
});

test('completion history resets only when the saved repeat actually differs from the latest task', () => {
  const opened = task({ repeat: 'daily' });
  const draft = { ...editorDraft(opened), repeat: 'weekdays' };
  const changed = mergeTaskEdits({ ...opened, completed: true, completedAt: '2026-10-21T05:00:00Z', completedDates: ['2026-10-20'] }, opened, draft, '2026-10-21T06:00:00Z', '2026-10-21');
  assert.equal(changed.repeat, 'weekdays');
  assert.equal(changed.completed, false);
  assert.equal(changed.completedAt, null);
  assert.deepEqual(changed.completedDates, []);
  const alreadyChanged = mergeTaskEdits({ ...opened, repeat: 'weekdays', completedDates: ['2026-10-21'] }, opened, draft, '2026-10-21T06:00:00Z', '2026-10-21');
  assert.deepEqual(alreadyChanged.completedDates, ['2026-10-21']);
});

test('a task deleted while its editor was open is never restored by saving a stale draft', () => {
  const opened = task();
  const draft = { ...editorDraft(opened), title: 'Stale title', deletedAt: null };
  assert.equal(mergeTaskEdits({ ...opened, deletedAt: '2026-10-21T05:00:00Z' }, opened, draft, '2026-10-21T06:00:00Z'), null);
  assert.equal(mergeTaskEdits(undefined, opened, draft, '2026-10-21T06:00:00Z'), null);
});

test('an untouched task form leaves the latest task unchanged and cannot submit hidden completion fields', () => {
  const opened = task();
  const latest = completeTask(opened, null, '2026-10-21T05:00:00Z');
  const saved = mergeTaskEdits(latest, opened, { ...editorDraft(opened), completed: false, completedDates: [], createdAt: 'changed', id: 'changed' }, '2026-10-21T06:00:00Z', '2026-10-21');
  assert.equal(saved, latest);
});

test('invalid cached data is rejected without accepting missing lists or unsupported repeats', () => {
  assert.equal(validateTaskData(INITIAL_TASK_DATA), INITIAL_TASK_DATA);
  assert.throws(() =>
    validateTaskData({
      ...INITIAL_TASK_DATA,
      tasks: [task({ repeat: 'sometimes' })],
    }),
  );
  assert.throws(() =>
    validateTaskData({
      ...INITIAL_TASK_DATA,
      tasks: [task({ listId: 'missing' })],
    }),
  );
  assert.throws(() =>
    validateTaskData({
      ...INITIAL_TASK_DATA,
      tasks: [task({ completedDates: ['not-a-date'] })],
    }),
  );
});

test('deleting a populated list preserves active, completed, recurring and deleted tasks after reload', () => {
  const data = {
    ...INITIAL_TASK_DATA,
    tasks: [
      task(),
      task({ id: 'done', completed: true, notes: 'Keep this note' }),
      task({ id: 'routine', repeat: 'daily', completedDates: ['2026-10-20'] }),
      task({ id: 'trash', deletedAt: '2026-10-21T05:00:00Z' }),
      task({ id: 'work-task', listId: 'work' }),
    ],
  };
  const removal = deleteTaskList(data, 'personal', 'learning', 'new-inbox');
  const restored = validateTaskData(JSON.parse(JSON.stringify(removal.data)));
  assert.equal(
    restored.lists.some((list) => list.id === 'personal'),
    false,
  );
  assert.deepEqual(
    restored.tasks,
    data.tasks.map((item) =>
      item.listId === 'personal' ? { ...item, listId: 'learning' } : item,
    ),
  );
  assert.equal(data.tasks[0].listId, 'personal');
  assert.deepEqual(restoreTaskList(restored, removal), data);
});

test('the final empty list can be deleted, saved, and restored', () => {
  const data = { ...INITIAL_TASK_DATA, lists: [INITIAL_TASK_DATA.lists[0]] };
  const removal = deleteTaskList(data, 'personal', '', 'new-inbox');
  assert.deepEqual(
    validateTaskData(JSON.parse(JSON.stringify(removal.data))).lists,
    [],
  );
  assert.deepEqual(restoreTaskList(removal.data, removal), data);
  assert.throws(() => validateTaskData({ ...removal.data, tasks: [task()] }));
});

test('deleting the last populated list moves tasks to Inbox and Undo keeps newer edits and tasks', () => {
  const data = {
    ...INITIAL_TASK_DATA,
    lists: [INITIAL_TASK_DATA.lists[0]],
    tasks: [task()],
  };
  const removal = deleteTaskList(data, 'personal', '', 'new-inbox');
  assert.equal(removal.data.lists[0].name, 'Inbox');
  assert.equal(validateTaskData(removal.data).tasks[0].listId, 'new-inbox');
  assert.deepEqual(restoreTaskList(removal.data, removal), data);
  const edited = {
    ...removal.data,
    tasks: [
      { ...removal.data.tasks[0], notes: 'Newer notes' },
      task({ id: 'new-task', listId: 'new-inbox' }),
    ],
  };
  const undone = restoreTaskList(edited, removal);
  assert.equal(validateTaskData(undone).lists.length, 2);
  assert.equal(undone.tasks[0].notes, 'Newer notes');
  assert.equal(undone.tasks[0].listId, 'personal');
  assert.equal(undone.tasks[1].listId, 'new-inbox');
});

test('stale list deletions do not lose tasks and Undo respects later moves', () => {
  const data = { ...INITIAL_TASK_DATA, tasks: [task()] };
  assert.equal(deleteTaskList(data, 'missing', 'work', 'inbox'), null);
  assert.equal(deleteTaskList(data, 'personal', 'missing', 'inbox'), null);
  const removal = deleteTaskList(data, 'personal', 'work', 'inbox');
  const movedAgain = {
    ...removal.data,
    tasks: [{ ...removal.data.tasks[0], listId: 'learning' }],
  };
  assert.equal(
    restoreTaskList(movedAgain, removal).tasks[0].listId,
    'learning',
  );
});
