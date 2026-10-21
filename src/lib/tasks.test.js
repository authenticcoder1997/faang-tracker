import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  completeTask,
  dateKey,
  getTaskRows,
  INITIAL_TASK_DATA,
  isValidDate,
  nextOccurrence,
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
