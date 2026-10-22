import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkspace,
  legacyFirestoreValues,
  mergeLegacyWorkspace,
  normalizeWorkspace,
  makeWorkspacePatch,
  applyWorkspacePatch,
  LEGACY_STORAGE_KEYS,
} from './workspace.js';
import { dsaTopics } from '../data/dsaTopics.js';
import { deleteTaskList } from './tasks.js';

const copy = (value) => structuredClone(value);
const task = (overrides = {}) => ({
  id: 'task-1',
  title: 'Read',
  listId: 'personal',
  repeat: 'none',
  dueDate: null,
  completed: false,
  completedDates: [],
  flagged: false,
  notes: '',
  createdAt: '2026-10-22T04:00:00.000Z',
  ...overrides,
});
const note = (overrides = {}) => ({
  id: 'note-1',
  title: 'Interview notes',
  content: 'Keep this content',
  updatedAt: '2026-10-22T04:00:00.000Z',
  ...overrides,
});
const bookmark = (overrides = {}) => ({
  id: 'https://example.com/',
  title: 'Example',
  url: 'https://example.com/',
  ...overrides,
});
const base = () => ({
  ...createWorkspace(),
  bookmarks: [bookmark()],
  notes: [note()],
  tasks: { ...createWorkspace().tasks, tasks: [task()] },
});

test('new workspaces include source progress, all 21 Important links and independent default task lists', () => {
  const first = createWorkspace();
  const second = createWorkspace();
  assert.equal(first.bookmarks.length, 21);
  const games = first.bookmarks.filter(
    (bookmark) => bookmark.folderPath?.[0] === 'Online Games',
  );
  assert.deepEqual(
    games.map((bookmark) => bookmark.url).sort(),
    ['https://cricket07.dhaiwat.com/', 'https://nfsmwonline.com/'],
  );
  for (const game of games)
    assert.deepEqual(game.folderPath, ['Online Games']);
  assert.equal(first.tasks.lists.length, 3);
  assert.deepEqual(first.tasks.tasks, []);
  assert.deepEqual(first.appearance, { mode: 'light', palette: 'neutral' });
  assert.equal(
    Object.values(first.progress.dsa).filter((item) => item.completed).length,
    dsaTopics.filter((item) => item.completed).length,
  );
  first.tasks.lists[0].name = 'Changed';
  assert.equal(second.tasks.lists[0].name, 'Personal');
  assert.ok(LEGACY_STORAGE_KEYS.includes('faang-tracker-dsa-v9'));
});

test('legacy migration retains task history, exact folder placement, notes and current progress overrides', () => {
  const cachedTasks = base().tasks;
  cachedTasks.tasks.push(
    task({
      id: 'daily',
      repeat: 'daily',
      completedDates: ['2026-10-21'],
      deletedAt: '2026-10-22',
    }),
  );
  const sourceCompleted = dsaTopics.find((item) => item.completed);
  const migrated = createWorkspace({
    'faang-tracker-tasks-v1': JSON.stringify(cachedTasks),
    'my-space-important-bookmarks-v1': JSON.stringify({
      version: 1,
      bookmarks: [
        {
          title: 'Course',
          url: 'https://example.com/course?x=1#lesson',
          folderPath: ['Learning', 'Courses'],
        },
      ],
    }),
    'faang-tracker-notes': JSON.stringify({
      version: 1,
      notes: [
        note(),
        note({ id: 123, title: 'Older note', updatedAt: '2026-01-01' }),
      ],
      pendingIds: ['note-1'],
    }),
    'my-space-theme': 'dark',
    'faang-tracker-dsa-v10': JSON.stringify([
      { id: sourceCompleted.id, completed: false, note: 'Intentional reset' },
      { id: 'retired-problem', completed: true, note: 'Preserve me' },
    ]),
    'faang-tracker-lld-v8': JSON.stringify([
      { id: 'lld-1', completed: true, note: 'LLD detail' },
    ]),
    'faang-tracker-hld-v8': JSON.stringify([{ id: 'hld-1', completed: true }]),
    'faang-tracker-concurrency-v1': JSON.stringify([
      { id: 'conc-1', completed: true },
    ]),
  });
  assert.deepEqual(migrated.tasks, cachedTasks);
  assert.deepEqual(migrated.bookmarks[0].folderPath, ['Learning', 'Courses']);
  assert.equal(
    migrated.bookmarks[0].url,
    'https://example.com/course?x=1#lesson',
  );
  assert.deepEqual(migrated.notes, [
    note(),
    note({ id: 123, title: 'Older note', updatedAt: '2026-01-01' }),
  ]);
  assert.equal(migrated.appearance.mode, 'dark');
  assert.deepEqual(migrated.progress.dsa[sourceCompleted.id], {
    completed: false,
    note: 'Intentional reset',
  });
  assert.deepEqual(migrated.progress.dsa['retired-problem'], {
    completed: true,
    note: 'Preserve me',
  });
  assert.equal(migrated.progress.lld['lld-1'].note, 'LLD detail');
  assert.equal(migrated.progress.hld['hld-1'].completed, true);
  assert.equal(migrated.progress.concurrency['conc-1'].completed, true);
});

test('old progress restores source completions and current cache wins over previous cache', () => {
  const sourceCompleted = dsaTopics.find((item) => item.completed);
  const old = JSON.stringify([
    { id: sourceCompleted.id, completed: false, note: 'Older note' },
  ]);
  const restored = createWorkspace({ 'faang-tracker-dsa-v9': old });
  assert.equal(restored.progress.dsa[sourceCompleted.id].completed, true);
  assert.equal(restored.progress.dsa[sourceCompleted.id].note, 'Older note');
  const current = createWorkspace({
    'faang-tracker-dsa-v9': old,
    'faang-tracker-dsa-v10': JSON.stringify([
      { id: sourceCompleted.id, completed: false, note: 'New note' },
    ]),
  });
  assert.deepEqual(current.progress.dsa[sourceCompleted.id], {
    completed: false,
    note: 'New note',
  });
});

test('migration preserves intentionally empty collections and recognizes plain old notes plus glass preferences', () => {
  const empty = createWorkspace({
    'faang-tracker-tasks-v1': JSON.stringify({
      version: 1,
      lists: [],
      tasks: [],
    }),
    'my-space-important-bookmarks-v1': '[]',
    'faang-tracker-notes': '[]',
    'my-space-theme': 'glass',
  });
  assert.deepEqual(empty.bookmarks, []);
  assert.deepEqual(empty.notes, []);
  assert.deepEqual(empty.tasks.lists, []);
  assert.deepEqual(empty.appearance, { mode: 'light', palette: 'neutral' });
  assert.equal(
    createWorkspace({
      'faang-tracker-notes': JSON.stringify({ notes: [note()] }),
    }).notes[0].content,
    note().content,
  );
  assert.deepEqual(
    createWorkspace({
      'my-space-theme': JSON.stringify({ mode: 'dark', palette: 'violet' }),
    }).appearance,
    { mode: 'dark', palette: 'violet' },
  );
});

test('malformed legacy data reports its key and never falls back to an empty replacement', () => {
  for (const [key, value] of [
    ['faang-tracker-tasks-v1', '{'],
    [
      'my-space-important-bookmarks-v1',
      JSON.stringify([{ url: 'javascript:alert(1)' }]),
    ],
    ['faang-tracker-notes', JSON.stringify([note({ content: 7 })])],
    ['my-space-theme', 'unknown'],
    [
      'faang-tracker-dsa-v10',
      JSON.stringify([{ id: 'dsa-1', completed: 'true' }]),
    ],
    ['faang-tracker-dsa-v9', 'null'],
  ])
    assert.throws(
      () => createWorkspace({ [key]: value }),
      (error) => error.message.includes(key),
    );
  assert.throws(
    () =>
      createWorkspace({
        'faang-tracker-dsa-v10': '[]',
        'faang-tracker-dsa-v9': '{',
      }),
    /faang-tracker-dsa-v9/,
  );
});

test('invalid cloud documents are rejected rather than resetting remote content', () => {
  assert.throws(() => normalizeWorkspace({ schemaVersion: 2 }), /version/);
  assert.throws(
    () => normalizeWorkspace({ ...base(), notes: [note(), note()] }),
    /Duplicate/,
  );
  assert.throws(
    () =>
      normalizeWorkspace({
        ...base(),
        tasks: { version: 1, lists: [], tasks: [task()] },
      }),
    /tasks/,
  );
  assert.throws(
    () =>
      normalizeWorkspace({ ...base(), notes: [note({ content: undefined })] }),
    /Unsupported/,
  );
  assert.throws(
    () =>
      normalizeWorkspace({
        ...base(),
        appearance: { mode: 'dark', palette: 'unrecognized' },
      }),
    /appearance/,
  );
});

test('importing only an old theme cannot resurrect deleted default bookmarks, lists or source completions', () => {
  const cloud = createWorkspace();
  cloud.bookmarks = [];
  cloud.notes = [];
  cloud.tasks = { version: 1, lists: [], tasks: [] };
  cloud.appearance = { mode: 'dark', palette: 'ocean' };
  cloud.progress.dsa = Object.fromEntries(
    Object.entries(cloud.progress.dsa).map(([id, value]) => [
      id,
      { ...value, completed: false },
    ]),
  );
  assert.deepEqual(
    mergeLegacyWorkspace(cloud, { 'my-space-theme': 'light' }),
    cloud,
  );
});

test('existing-account imports merge only supplied sections and actual cached progress rows', () => {
  const cloud = base();
  cloud.bookmarks = [];
  cloud.tasks = { version: 1, lists: [], tasks: [] };
  cloud.progress.dsa['dsa-1'] = { completed: false, note: 'Cloud explanation' };
  cloud.progress.dsa['dsa-2'] = { completed: false, note: '' };
  const sourceComplete = dsaTopics.find(
    (item) => item.completed && !['dsa-1', 'dsa-2'].includes(item.id),
  );
  cloud.progress.dsa[sourceComplete.id].completed = false;
  const result = mergeLegacyWorkspace(cloud, {
    'faang-tracker-dsa-v10': JSON.stringify([
      { id: 'dsa-1', completed: true, note: 'Older explanation' },
      { id: 'dsa-2', completed: false, note: 'Recovered note' },
    ]),
  });
  assert.deepEqual(result.tasks, cloud.tasks);
  assert.deepEqual(result.bookmarks, []);
  assert.deepEqual(result.notes, cloud.notes);
  assert.deepEqual(result.progress.dsa['dsa-1'], {
    completed: true,
    note: 'Cloud explanation',
  });
  assert.deepEqual(result.progress.dsa['dsa-2'], {
    completed: false,
    note: 'Recovered note',
  });
  assert.equal(result.progress.dsa[sourceComplete.id].completed, false);
});

test('existing-account imports preserve cloud entities and append older missing IDs with valid list references', () => {
  const cloud = base();
  cloud.tasks.tasks[0].title = 'Cloud task';
  cloud.notes[0].content = 'Cloud note';
  cloud.bookmarks[0].title = 'Cloud bookmark';
  const priorTasks = copy(cloud.tasks);
  priorTasks.lists[0].name = 'Older list name';
  priorTasks.tasks[0].title = 'Older task title';
  priorTasks.lists.push({ id: 'old-list', name: 'Old list', color: '#60a5fa' });
  priorTasks.tasks.push(task({ id: 'old-task', listId: 'old-list' }));
  const result = mergeLegacyWorkspace(cloud, {
    'faang-tracker-tasks-v1': JSON.stringify(priorTasks),
    'my-space-important-bookmarks-v1': JSON.stringify([
      bookmark({ title: 'Older bookmark' }),
      bookmark({ id: 'https://older.example/', url: 'https://older.example/' }),
    ]),
    'faang-tracker-notes': JSON.stringify({
      version: 1,
      notes: [
        note({ content: 'Older content' }),
        note({ id: 'old-note' }),
        note({ id: 'deleted-note' }),
      ],
      deletedIds: ['deleted-note'],
    }),
  });
  assert.equal(result.tasks.tasks[0].title, 'Cloud task');
  assert.equal(result.tasks.lists[0].name, 'Personal');
  assert.equal(
    result.tasks.tasks.find((item) => item.id === 'old-task').listId,
    'old-list',
  );
  assert.equal(result.notes[0].content, 'Cloud note');
  assert.deepEqual(
    result.notes.map((item) => item.id),
    ['note-1', 'old-note'],
  );
  assert.equal(result.bookmarks[0].title, 'Cloud bookmark');
  assert.equal(result.bookmarks.length, 2);
});

test('a newer browser note draft replaces its older cloud version during migration', () => {
  const cloud = base();
  cloud.notes = [note({ content: 'Older server draft', updatedAt: '2026-10-20T04:00:00.000Z' })];
  const browserNote = note({ title: 'New title', content: 'Newer browser draft', updatedAt: '2026-10-22T04:00:00.000Z' });
  const result = mergeLegacyWorkspace(cloud, {
    'faang-tracker-notes': JSON.stringify({ version: 1, notes: [browserNote] }),
  });
  assert.deepEqual(result.notes, [browserNote]);
  assert.equal(cloud.notes[0].content, 'Older server draft');
});

test('newer cloud notes and equal-timestamp cloud notes win over imported drafts', () => {
  const cloud = base();
  cloud.notes = [
    note({ content: 'New cloud draft', updatedAt: '2026-10-22T04:00:00.000Z' }),
    note({ id: 'equal', content: 'Cloud draft with equal timestamp' }),
  ];
  const result = mergeLegacyWorkspace(cloud, {
    'faang-tracker-notes': JSON.stringify([
      note({ content: 'Older browser draft', updatedAt: '2026-10-20T04:00:00.000Z' }),
      note({ id: 'equal', content: 'Different browser draft with equal timestamp' }),
    ]),
  });
  assert.deepEqual(result.notes, cloud.notes);
});

test('a notes-only migration never restores defaults or changes other existing cloud sections', () => {
  const cloud = base();
  cloud.bookmarks = [];
  cloud.tasks = { version: 1, lists: [], tasks: [] };
  cloud.appearance = { mode: 'dark', palette: 'violet' };
  for (const state of Object.values(cloud.progress.dsa)) state.completed = false;
  const result = mergeLegacyWorkspace(cloud, {
    'faang-tracker-notes': JSON.stringify([note({ content: 'Newer imported note', updatedAt: '2026-10-23T04:00:00.000Z' })]),
  });
  assert.equal(result.notes[0].content, 'Newer imported note');
  assert.deepEqual(result.tasks, cloud.tasks);
  assert.deepEqual(result.bookmarks, cloud.bookmarks);
  assert.deepEqual(result.appearance, cloud.appearance);
  assert.deepEqual(result.progress, cloud.progress);
});

test('malformed legacy data aborts an existing-account import without modifying cloud data', () => {
  const cloud = base();
  const before = copy(cloud);
  assert.throws(
    () => mergeLegacyWorkspace(cloud, { 'faang-tracker-notes': '{' }),
    /faang-tracker-notes/,
  );
  assert.deepEqual(cloud, before);
});

test('old Firebase progress conversion retains completedIds, explicit false states, notes and unknown IDs', () => {
  const values = legacyFirestoreValues({
    dsa_progress: {
      completedIds: ['dsa-1'],
      itemState: { 'dsa-2': { completed: false, note: 'Review later' } },
    },
    lld_progress: { completedIds: ['lld-1'] },
    hld_progress: {
      itemState: { 'hld-1': { completed: true, note: 'Architecture note' } },
    },
    concurrency_progress: {
      completedIds: ['conc-1', 'conc-13'],
      itemState: {
        'conc-1': { completed: false, note: 'Explicitly unchecked' },
        'old-conc-problem': { completed: true, note: 'Retired problem' },
      },
    },
  });
  assert.deepEqual(JSON.parse(values['faang-tracker-concurrency-v1']), [
    { id: 'conc-1', completed: false, note: 'Explicitly unchecked' },
    { id: 'conc-13', completed: true, note: '' },
    { id: 'old-conc-problem', completed: true, note: 'Retired problem' },
  ]);
  assert.equal(
    JSON.parse(values['faang-tracker-dsa-v10']).find(
      (row) => row.id === 'dsa-2',
    ).note,
    'Review later',
  );
  assert.equal(JSON.parse(values['faang-tracker-lld-v8'])[0].completed, true);
  assert.equal(
    JSON.parse(values['faang-tracker-hld-v8'])[0].note,
    'Architecture note',
  );
  assert.equal(Object.keys(values).length, 4);
});

test('old Firebase note import respects browser-deleted IDs and preserves browser notes during composition', () => {
  const browser = {
    'faang-tracker-notes': JSON.stringify({
      version: 1,
      notes: [note({ content: 'Newer browser draft' })],
      deletedIds: ['deleted-note', 123],
    }),
  };
  const values = legacyFirestoreValues(
    {
      user_notes: {
        notes: [
          note({ content: 'Older server draft' }),
          note({ id: 'server-only', content: 'Only stored in Firebase' }),
          note({ id: 'deleted-note' }),
          note({ id: 123 }),
          note({ id: '123', content: 'A different string ID' }),
        ],
      },
      concurrency_progress: { completedIds: ['conc-1', 'conc-13'] },
    },
    browser,
  );
  const converted = JSON.parse(values['faang-tracker-notes']).notes;
  assert.deepEqual(
    converted.map((entry) => entry.id),
    ['note-1', 'server-only', '123'],
  );
  const workspace = mergeLegacyWorkspace(createWorkspace(browser), values);
  assert.equal(
    workspace.notes.find((entry) => entry.id === 'note-1').content,
    'Newer browser draft',
  );
  assert.equal(
    workspace.notes.find((entry) => entry.id === 'server-only').content,
    'Only stored in Firebase',
  );
  assert.equal(workspace.notes.length, 3);
  assert.equal(workspace.progress.concurrency['conc-1'].completed, true);
  assert.equal(workspace.progress.concurrency['conc-13'].completed, true);
});

test('old Firebase conversion skips missing documents and reports malformed collections without defaults', () => {
  assert.deepEqual(legacyFirestoreValues({ concurrency_progress: null }), {});
  assert.deepEqual(
    legacyFirestoreValues({
      dsa_progress: { completedIds: [], itemState: {} },
    }),
    { 'faang-tracker-dsa-v10': '[]' },
  );
  assert.throws(
    () =>
      legacyFirestoreValues({
        hld_progress: {
          completedIds: ['hld-1'],
          itemState: { 'hld-1': { completed: 'true' } },
        },
      }),
    /hld_progress/,
  );
  assert.throws(
    () =>
      legacyFirestoreValues(
        { user_notes: { notes: [note()] } },
        { 'faang-tracker-notes': '{' },
      ),
    /faang-tracker-notes/,
  );
  assert.throws(
    () => legacyFirestoreValues({ user_notes: { notes: 'unreadable' } }),
    /user_notes/,
  );
});

test('legacy task records can omit website links while present links are normalized for Firebase', () => {
  const oldTaskData = base().tasks;
  const legacy = createWorkspace({ 'faang-tracker-tasks-v1': JSON.stringify(oldTaskData) });
  assert.equal(Object.hasOwn(legacy.tasks.tasks[0], 'links'), false);
  const linked = base();
  linked.tasks.tasks[0].links = ['example.com/course', 'https://example.com/course'];
  assert.deepEqual(normalizeWorkspace(linked).tasks.tasks[0].links, ['https://example.com/course']);
  assert.deepEqual(linked.tasks.tasks[0].links, ['example.com/course', 'https://example.com/course']);
  linked.tasks.tasks[0].links = ['javascript:alert(1)'];
  assert.throws(() => normalizeWorkspace(linked));
});

test('task links survive serialized Firebase patches without erasing unrelated phone changes', () => {
  const before = base();
  before.tasks.tasks[0].repeat = 'daily';
  const after = copy(before);
  after.tasks.tasks[0].links = ['leetcode.com/problems/two-sum/'];
  const remote = copy(before);
  remote.tasks.tasks[0].notes = 'Added from phone';
  remote.tasks.tasks[0].completedDates = ['2026-10-21'];
  const patch = JSON.parse(JSON.stringify(makeWorkspacePatch(before, after)));
  const result = applyWorkspacePatch(remote, patch);
  assert.deepEqual(result.tasks.tasks[0].links, ['https://leetcode.com/problems/two-sum/']);
  assert.equal(result.tasks.tasks[0].notes, 'Added from phone');
  assert.deepEqual(result.tasks.tasks[0].completedDates, ['2026-10-21']);
  assert.deepEqual(normalizeWorkspace(JSON.parse(JSON.stringify(result))), result);
  const titleOnly = copy(before);
  titleOnly.tasks.tasks[0].title = 'Renamed on laptop';
  const renamed = applyWorkspacePatch(result, makeWorkspacePatch(before, titleOnly));
  assert.deepEqual(renamed.tasks.tasks[0].links, ['https://leetcode.com/problems/two-sum/']);
  assert.equal(renamed.tasks.tasks[0].title, 'Renamed on laptop');
});

test('task edits and concurrent additions merge by ID and by changed field without mutating snapshots', () => {
  const before = base();
  const after = copy(before);
  after.tasks.tasks[0].title = 'Read the system design chapter';
  after.tasks.tasks.push(task({ id: 'local-new', title: 'Local task' }));
  const remote = copy(before);
  remote.tasks.tasks[0].notes = 'Added from phone';
  remote.tasks.tasks.push(task({ id: 'phone-new', title: 'Phone task' }));
  const savedRemote = copy(remote);
  const savedBefore = copy(before);
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.equal(
    result.tasks.tasks.find((item) => item.id === 'task-1').title,
    after.tasks.tasks[0].title,
  );
  assert.equal(
    result.tasks.tasks.find((item) => item.id === 'task-1').notes,
    'Added from phone',
  );
  assert.deepEqual(
    new Set(result.tasks.tasks.map((item) => item.id)),
    new Set(['task-1', 'local-new', 'phone-new']),
  );
  assert.deepEqual(remote, savedRemote);
  assert.deepEqual(before, savedBefore);
});

test('stale edits never resurrect deleted tasks, bookmarks or notes', () => {
  const before = base();
  const after = copy(before);
  after.tasks.tasks[0].title = 'Stale edit';
  after.bookmarks[0].title = 'Stale website rename';
  after.notes[0].content = 'Stale note draft';
  const remote = copy(before);
  remote.tasks.tasks = [];
  remote.bookmarks = [];
  remote.notes = [];
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.deepEqual(result.tasks.tasks, []);
  assert.deepEqual(result.bookmarks, []);
  assert.deepEqual(result.notes, []);
});

test('observed removals preserve new notes and websites from another device', () => {
  const before = base();
  const after = copy(before);
  after.notes = [];
  after.bookmarks = [];
  const remote = copy(before);
  remote.notes.push(note({ id: 'phone-note', content: 'Phone content' }));
  remote.bookmarks.push(
    bookmark({
      id: 'https://phone.example/',
      title: 'Phone website',
      url: 'https://phone.example/',
    }),
  );
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.deepEqual(
    result.notes.map((item) => item.id),
    ['phone-note'],
  );
  assert.deepEqual(
    result.bookmarks.map((item) => item.url),
    ['https://phone.example/'],
  );
});

test('bookmark folder identity preserves the same website saved in multiple folders', () => {
  const migrated = createWorkspace({
    'my-space-important-bookmarks-v1': JSON.stringify([
      bookmark({ title: 'Work copy', folderPath: ['Work'] }),
      bookmark({ title: 'Learning copy', folderPath: ['Learning'] }),
    ]),
  });
  assert.equal(migrated.bookmarks.length, 2);
  assert.notEqual(migrated.bookmarks[0].id, migrated.bookmarks[1].id);
  const after = copy(migrated);
  after.bookmarks[0].title = 'Renamed at work';
  const remote = copy(migrated);
  remote.bookmarks[1].title = 'Renamed on phone';
  const result = applyWorkspacePatch(
    remote,
    makeWorkspacePatch(migrated, after),
  );
  assert.deepEqual(
    result.bookmarks.map((item) => item.title),
    ['Renamed at work', 'Renamed on phone'],
  );
});

test('explicit bookmark ordering keeps unseen other-device links in place', () => {
  const before = base();
  before.bookmarks.push(
    bookmark({
      id: 'https://second.example/',
      url: 'https://second.example/',
      title: 'Second',
    }),
  );
  const after = copy(before);
  after.bookmarks.reverse();
  const remote = copy(before);
  remote.bookmarks.splice(
    1,
    0,
    bookmark({
      id: 'https://phone.example/',
      url: 'https://phone.example/',
      title: 'Phone',
    }),
  );
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.deepEqual(
    result.bookmarks.map((item) => item.title),
    ['Second', 'Phone', 'Example'],
  );
});

test('multiple new bookmarks before an existing anchor keep the imported order', () => {
  const before = base();
  const makeBookmark = (title) => ({ id: `https://${title.toLowerCase()}.example/`, title, url: `https://${title.toLowerCase()}.example/` });
  before.bookmarks = [makeBookmark('C')];
  const after = copy(before);
  after.bookmarks = ['A', 'B', 'C'].map(makeBookmark);
  const result = applyWorkspacePatch(before, makeWorkspacePatch(before, after));
  assert.deepEqual(result.bookmarks.map((entry) => entry.title), ['A', 'B', 'C']);
});

test('ordering newly imported links retains unseen concurrent remote links', () => {
  const before = base();
  const makeBookmark = (title) => ({ id: `https://${title.toLowerCase()}.example/`, title, url: `https://${title.toLowerCase()}.example/` });
  before.bookmarks = [makeBookmark('C')];
  const after = copy(before);
  after.bookmarks = ['A', 'B', 'C'].map(makeBookmark);
  const remote = copy(before);
  remote.bookmarks = ['PhoneFirst', 'C', 'PhoneLast'].map(makeBookmark);
  const patch = makeWorkspacePatch(before, after);
  const result = applyWorkspacePatch(remote, patch);
  assert.deepEqual(result.bookmarks.map((entry) => entry.title), ['PhoneFirst', 'A', 'B', 'PhoneLast', 'C']);
  assert.deepEqual(result.bookmarks.filter((entry) => ['A', 'B', 'C'].includes(entry.title)).map((entry) => entry.title), ['A', 'B', 'C']);
  assert.deepEqual(result.bookmarks.filter((entry) => entry.title.startsWith('Phone')).map((entry) => entry.title), ['PhoneFirst', 'PhoneLast']);
  assert.deepEqual(applyWorkspacePatch(result, patch), result);
});

test('a concurrent entity with the same added ID is retained rather than overwritten', () => {
  const before = base();
  before.notes = [];
  const after = copy(before);
  after.notes = [note({ content: 'Laptop draft' })];
  const remote = copy(before);
  remote.notes = [note({ content: 'Already saved on phone' })];
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.equal(result.notes[0].content, 'Already saved on phone');
});

test('note fields and appearance fields merge independently across devices', () => {
  const before = base();
  const after = copy(before);
  after.notes[0].title = 'Renamed on laptop';
  after.appearance.palette = 'ocean';
  const remote = copy(before);
  remote.notes[0].content = 'Edited on phone';
  remote.appearance.mode = 'dark';
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.equal(result.notes[0].title, 'Renamed on laptop');
  assert.equal(result.notes[0].content, 'Edited on phone');
  assert.deepEqual(result.appearance, { mode: 'dark', palette: 'ocean' });
});

test('recurring completion changes apply as set deltas and retain phone completion dates', () => {
  const before = base();
  before.tasks.tasks[0] = task({
    repeat: 'daily',
    completedDates: ['2026-10-20'],
  });
  const after = copy(before);
  after.tasks.tasks[0].completedDates = ['2026-10-21'];
  const remote = copy(before);
  remote.tasks.tasks[0].completedDates.push('2026-10-22');
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.deepEqual(result.tasks.tasks[0].completedDates, [
    '2026-10-21',
    '2026-10-22',
  ]);
});

test('deleting a list also moves unseen phone tasks to the selected destination', () => {
  const before = base();
  const after = copy(before);
  after.tasks = deleteTaskList(
    before.tasks,
    'personal',
    'learning',
    'new-inbox',
  ).data;
  const remote = copy(before);
  remote.tasks.tasks.push(
    task({ id: 'phone-new', notes: 'Must survive list deletion' }),
  );
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.equal(
    result.tasks.lists.some((list) => list.id === 'personal'),
    false,
  );
  assert.equal(result.tasks.tasks.length, 2);
  assert.ok(result.tasks.tasks.every((item) => item.listId === 'learning'));
  assert.equal(
    result.tasks.tasks.find((item) => item.id === 'phone-new').notes,
    'Must survive list deletion',
  );
});

test('deleting the last empty list creates Inbox if another device concurrently added a task', () => {
  const before = base();
  before.tasks = { version: 1, lists: [before.tasks.lists[0]], tasks: [] };
  const after = copy(before);
  after.tasks.lists = [];
  const remote = copy(before);
  remote.tasks.tasks = [task({ id: 'unseen' })];
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.equal(result.tasks.lists.length, 1);
  assert.equal(result.tasks.lists[0].name, 'Inbox');
  assert.equal(result.tasks.tasks[0].listId, result.tasks.lists[0].id);
});

test('a task created on a stale device survives deletion of its former list', () => {
  const before = base();
  const after = copy(before);
  after.tasks.tasks.push(task({ id: 'new-after-delete' }));
  const remote = copy(before);
  remote.tasks = deleteTaskList(
    before.tasks,
    'personal',
    'work',
    'new-inbox',
  ).data;
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.equal(
    result.tasks.tasks.find((item) => item.id === 'new-after-delete').listId,
    'work',
  );
  assert.equal(result.tasks.tasks.length, 2);
});

test('per-problem progress deltas preserve concurrent notes and other completions', () => {
  const before = base();
  before.progress.dsa['dsa-1'] = { completed: false, note: '' };
  before.progress.dsa['dsa-2'] = { completed: false, note: '' };
  const after = copy(before);
  after.progress.dsa['dsa-1'].completed = true;
  const remote = copy(before);
  remote.progress.dsa['dsa-1'].note = 'Phone explanation';
  remote.progress.dsa['dsa-2'].completed = true;
  const result = applyWorkspacePatch(remote, makeWorkspacePatch(before, after));
  assert.deepEqual(result.progress.dsa['dsa-1'], {
    completed: true,
    note: 'Phone explanation',
  });
  assert.equal(result.progress.dsa['dsa-2'].completed, true);
});

test('noop patches preserve all current remote edits', () => {
  const before = base();
  const remote = copy(before);
  remote.notes.push(note({ id: 'later' }));
  remote.appearance.palette = 'rose';
  remote.tasks.tasks[0].flagged = true;
  assert.deepEqual(
    applyWorkspacePatch(remote, makeWorkspacePatch(before, copy(before))),
    remote,
  );
});
