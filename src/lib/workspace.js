import { dsaTopics } from '../data/dsaTopics.js';
import { lldTopics } from '../data/lldTopics.js';
import { hldTopics } from '../data/hldTopics.js';
import { concurrencyTopics } from '../data/concurrencyTopics.js';
import { importantBookmarks } from '../data/importantBookmarks.js';
import { normalizeBookmark } from './bookmarks.js';
import { INITIAL_TASK_DATA, LIST_COLORS, validateTaskData } from './tasks.js';

const SOURCES = {
  dsa: dsaTopics,
  lld: lldTopics,
  hld: hldTopics,
  concurrency: concurrencyTopics,
};
const PROGRESS_KEYS = {
  dsa: ['faang-tracker-dsa-v10', 'faang-tracker-dsa-v9'],
  lld: ['faang-tracker-lld-v8'],
  hld: ['faang-tracker-hld-v8'],
  concurrency: ['faang-tracker-concurrency-v1'],
};
export const LEGACY_STORAGE_KEYS = Object.freeze([
  'faang-tracker-tasks-v1',
  'my-space-important-bookmarks-v1',
  'faang-tracker-notes',
  'my-space-theme',
  ...Object.values(PROGRESS_KEYS).flat(),
]);
const PALETTES = ['neutral', 'ocean', 'violet', 'rose', 'amber'];

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// A workspace is JSON data. Reject unsupported values instead of silently
// removing them before an authoritative cloud write.
function clone(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(clone);
  if (
    object(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, clone(item)]),
    );
  throw new Error('Unsupported workspace value');
}

function entityKey(id) {
  return `${typeof id}:${id}`;
}

function uniqueEntities(value, label, normalize) {
  assert(Array.isArray(value), `Invalid ${label}`);
  const seen = new Set();
  return value.map((entry) => {
    const next = normalize(entry);
    const key = entityKey(next.id);
    assert(!seen.has(key), `Duplicate ${label} ID`);
    seen.add(key);
    return next;
  });
}

function tasks(value) {
  assert(object(value), 'Invalid tasks');
  const data = clone(value);
  validateTaskData(data);
  data.lists = uniqueEntities(data.lists, 'list', (list) => {
    assert(list.id.trim() && list.name.trim(), 'Invalid list');
    return list;
  });
  data.tasks = uniqueEntities(data.tasks, 'task', (task) => {
    assert(task.id.trim(), 'Invalid task ID');
    for (const field of ['completed', 'flagged'])
      assert(
        task[field] === undefined || typeof task[field] === 'boolean',
        `Invalid task ${field}`,
      );
    for (const field of ['notes', 'updatedAt', 'completedAt', 'deletedAt'])
      assert(
        task[field] === undefined ||
          task[field] === null ||
          typeof task[field] === 'string',
        `Invalid task ${field}`,
      );
    return {
      ...task,
      completedDates: [...new Set(task.completedDates)].sort(),
    };
  });
  return data;
}

function bookmarks(value) {
  return uniqueEntities(value, 'bookmark', (bookmark) => {
    const next = normalizeBookmark(bookmark);
    assert(next, 'Invalid bookmark');
    return next;
  });
}

function notes(value) {
  return uniqueEntities(value, 'note', (note) => {
    assert(object(note), 'Invalid note');
    assert(
      (typeof note.id === 'string' && note.id) || Number.isFinite(note.id),
      'Invalid note ID',
    );
    assert(
      note.title === undefined || typeof note.title === 'string',
      'Invalid note title',
    );
    assert(
      note.content === undefined || typeof note.content === 'string',
      'Invalid note content',
    );
    assert(
      note.updatedAt === undefined ||
        (typeof note.updatedAt === 'string' &&
          Number.isFinite(Date.parse(note.updatedAt))),
      'Invalid note date',
    );
    return {
      ...clone(note),
      title: note.title ?? '',
      content: note.content ?? '',
      updatedAt: note.updatedAt ?? '1970-01-01T00:00:00.000Z',
    };
  });
}

function appearance(value) {
  assert(
    object(value) &&
      ['light', 'dark'].includes(value.mode) &&
      PALETTES.includes(value.palette),
    'Invalid appearance',
  );
  return { mode: value.mode, palette: value.palette };
}

function progressState(value) {
  assert(object(value), 'Invalid study progress');
  return Object.fromEntries(
    Object.entries(value).map(([id, state]) => {
      assert(
        id &&
          object(state) &&
          typeof state.completed === 'boolean' &&
          (state.note === undefined || typeof state.note === 'string'),
        'Invalid problem progress',
      );
      return [id, { completed: state.completed, note: state.note ?? '' }];
    }),
  );
}

/** Validate a complete cloud document without replacing unreadable data. */
export function normalizeWorkspace(value) {
  assert(
    object(value) && value.schemaVersion === 1,
    'Unrecognized workspace version',
  );
  assert(object(value.progress), 'Invalid study progress');
  return {
    schemaVersion: 1,
    tasks: tasks(value.tasks),
    bookmarks: bookmarks(value.bookmarks),
    notes: notes(value.notes),
    appearance: appearance(value.appearance),
    progress: Object.fromEntries(
      Object.keys(SOURCES).map((name) => [
        name,
        progressState(value.progress[name]),
      ]),
    ),
  };
}

function initialProgress() {
  return Object.fromEntries(
    Object.entries(SOURCES).map(([name, topics]) => [
      name,
      Object.fromEntries(
        topics.map((topic) => [
          topic.id,
          { completed: !!topic.completed, note: topic.note || '' },
        ]),
      ),
    ]),
  );
}

function legacyProgress(value, source, restoreSourceCompletions) {
  assert(Array.isArray(value), 'Invalid progress cache');
  const result = clone(source);
  const seen = new Set();
  for (const item of value) {
    assert(
      object(item) &&
        typeof item.id === 'string' &&
        item.id &&
        !seen.has(item.id),
      'Invalid cached problem',
    );
    assert(
      item.completed === undefined || typeof item.completed === 'boolean',
      'Invalid cached completion',
    );
    assert(
      item.note === undefined || typeof item.note === 'string',
      'Invalid cached problem note',
    );
    seen.add(item.id);
    const initial = Object.hasOwn(result, item.id)
      ? result[item.id]
      : { completed: false, note: '' };
    Object.defineProperty(result, item.id, {
      value: {
        completed: restoreSourceCompletions
          ? !!(initial.completed || item.completed)
          : (item.completed ?? initial.completed),
        note: item.note ?? initial.note,
      },
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  return result;
}

/** Migrate only explicit legacy values; the caller keeps them until cloud save succeeds. */
export function createWorkspace(legacy = {}) {
  assert(object(legacy), 'Invalid legacy storage');
  const workspace = {
    schemaVersion: 1,
    tasks: clone(INITIAL_TASK_DATA),
    bookmarks: bookmarks(importantBookmarks),
    notes: [],
    appearance: { mode: 'light', palette: 'neutral' },
    progress: initialProgress(),
  };
  for (const key of LEGACY_STORAGE_KEYS) {
    if (
      !Object.hasOwn(legacy, key) ||
      legacy[key] === null ||
      legacy[key] === undefined
    )
      continue;
    try {
      const raw = legacy[key];
      assert(typeof raw === 'string', 'Expected saved text');
      let value;
      if (key === 'my-space-theme' && ['light', 'dark', 'glass'].includes(raw))
        value = raw;
      else value = JSON.parse(raw);
      if (key === 'faang-tracker-tasks-v1') workspace.tasks = tasks(value);
      else if (key === 'my-space-important-bookmarks-v1') {
        assert(
          Array.isArray(value) ||
            ((value?.version === undefined || value.version === 1) &&
              Array.isArray(value?.bookmarks)),
          'Invalid bookmark cache',
        );
        workspace.bookmarks = bookmarks(
          Array.isArray(value) ? value : value.bookmarks,
        );
      } else if (key === 'faang-tracker-notes') {
        assert(
          Array.isArray(value) ||
            ((value?.version === undefined || value.version === 1) &&
              Array.isArray(value?.notes)),
          'Invalid notes cache',
        );
        workspace.notes = notes(Array.isArray(value) ? value : value.notes);
        if (!Array.isArray(value) && value.deletedIds !== undefined) {
          assert(Array.isArray(value.deletedIds), 'Invalid deleted note IDs');
          const deleted = new Set(value.deletedIds.map(entityKey));
          workspace.notes = workspace.notes.filter(
            (note) => !deleted.has(entityKey(note.id)),
          );
        }
      } else if (key === 'my-space-theme') {
        if (typeof value === 'string') {
          assert(
            ['light', 'dark', 'glass'].includes(value),
            'Invalid saved theme',
          );
          workspace.appearance.mode = value === 'dark' ? 'dark' : 'light';
        } else workspace.appearance = appearance(value);
      } else {
        const [name, keys] = Object.entries(PROGRESS_KEYS).find(([, keys]) =>
          keys.includes(key),
        );
        // Validate older keys too, even when a newer cache takes precedence.
        const migrated = legacyProgress(
          value,
          workspace.progress[name],
          key !== keys[0],
        );
        if (
          key === keys[0] ||
          legacy[keys[0]] === null ||
          legacy[keys[0]] === undefined
        )
          workspace.progress[name] = migrated;
      }
    } catch (error) {
      throw new Error(`Could not migrate ${key}: ${error.message}`, {
        cause: error,
      });
    }
  }
  return normalizeWorkspace(workspace);
}

/** One-time import into an existing account. Defaults are only for a new account. */
export function mergeLegacyWorkspace(cloud, legacy) {
  const current = normalizeWorkspace(cloud);
  // Validate every supplied legacy cache before permitting cleanup of any key.
  const imported = createWorkspace(legacy);
  const supplied = (key) =>
    Object.hasOwn(legacy, key) &&
    legacy[key] !== null &&
    legacy[key] !== undefined;
  const union = (remote, previous) => {
    const ids = new Set(remote.map((entry) => entityKey(entry.id)));
    return [
      ...remote,
      ...previous.filter((entry) => !ids.has(entityKey(entry.id))),
    ];
  };
  const next = clone(current);
  if (supplied('faang-tracker-tasks-v1')) {
    next.tasks.lists = union(current.tasks.lists, imported.tasks.lists);
    next.tasks.tasks = union(current.tasks.tasks, imported.tasks.tasks);
  }
  if (supplied('my-space-important-bookmarks-v1'))
    next.bookmarks = union(current.bookmarks, imported.bookmarks);
  if (supplied('faang-tracker-notes')) {
    const previousById = new Map(imported.notes.map((note) => [entityKey(note.id), note]));
    const latestNotes = current.notes.map((note) => {
      const previous = previousById.get(entityKey(note.id));
      return previous && Date.parse(previous.updatedAt) > Date.parse(note.updatedAt)
        ? previous
        : note;
    });
    next.notes = union(latestNotes, imported.notes);
  }
  for (const [name, keys] of Object.entries(PROGRESS_KEYS)) {
    const key = keys.find(supplied);
    if (!key) continue;
    // Only actual cached rows are evidence of previous user data. The source
    // completions seeded by createWorkspace must never change an existing account.
    for (const row of JSON.parse(legacy[key])) {
      const previous = {
        completed: row.completed ?? false,
        note: row.note ?? '',
      };
      const remote = Object.hasOwn(current.progress[name], row.id)
        ? current.progress[name][row.id]
        : null;
      Object.defineProperty(next.progress[name], row.id, {
        value: remote
          ? {
              completed: remote.completed || previous.completed,
              note: remote.note || previous.note,
            }
          : previous,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
  }
  return normalizeWorkspace(next);
}

/** Adapt the older Firestore collections without adding any new-account defaults. */
export function legacyFirestoreValues(documents, browserLegacy = {}) {
  assert(
    object(documents) && object(browserLegacy),
    'Invalid previous Firebase data',
  );
  const values = {};
  const collections = {
    dsa_progress: 'dsa',
    lld_progress: 'lld',
    hld_progress: 'hld',
    concurrency_progress: 'concurrency',
  };
  for (const [collection, track] of Object.entries(collections)) {
    const document = documents[collection];
    if (document === null || document === undefined) continue;
    try {
      assert(object(document), 'Invalid progress document');
      const completedIds =
        document.completedIds === undefined ? [] : document.completedIds;
      const itemState =
        document.itemState === undefined ? {} : document.itemState;
      assert(
        Array.isArray(completedIds) &&
          completedIds.every((id) => typeof id === 'string' && id),
        'Invalid completed problem IDs',
      );
      assert(object(itemState), 'Invalid problem state');
      const ids = new Set([...completedIds, ...Object.keys(itemState)]);
      const completed = new Set(completedIds);
      const rows = [...ids].map((id) => {
        assert(id, 'Invalid problem ID');
        const state = Object.hasOwn(itemState, id) ? itemState[id] : {};
        assert(object(state), 'Invalid problem state');
        assert(
          state.completed === undefined || typeof state.completed === 'boolean',
          'Invalid completion state',
        );
        assert(
          state.note === undefined || typeof state.note === 'string',
          'Invalid problem note',
        );
        return {
          id,
          completed: state.completed ?? completed.has(id),
          note: state.note ?? '',
        };
      });
      values[PROGRESS_KEYS[track][0]] = JSON.stringify(rows);
    } catch (error) {
      throw new Error(`Could not import ${collection}: ${error.message}`, {
        cause: error,
      });
    }
  }
  if (documents.user_notes !== null && documents.user_notes !== undefined) {
    try {
      assert(object(documents.user_notes), 'Invalid notes document');
      const previous = notes(documents.user_notes.notes);
      let deleted = new Set();
      const raw = browserLegacy['faang-tracker-notes'];
      if (raw !== undefined && raw !== null) {
        try {
          assert(typeof raw === 'string', 'Expected saved text');
          const cached = JSON.parse(raw);
          assert(
            Array.isArray(cached) ||
              ((cached?.version === undefined || cached.version === 1) &&
                Array.isArray(cached?.notes)),
            'Invalid notes cache',
          );
          notes(Array.isArray(cached) ? cached : cached.notes);
          if (!Array.isArray(cached) && cached.deletedIds !== undefined) {
            assert(
              Array.isArray(cached.deletedIds) &&
                cached.deletedIds.every(
                  (id) => (typeof id === 'string' && id) || Number.isFinite(id),
                ),
              'Invalid deleted note IDs',
            );
            deleted = new Set(cached.deletedIds.map(entityKey));
          }
        } catch (error) {
          throw new Error(
            `Could not read faang-tracker-notes: ${error.message}`,
            { cause: error },
          );
        }
      }
      values['faang-tracker-notes'] = JSON.stringify({
        version: 1,
        notes: previous.filter((entry) => !deleted.has(entityKey(entry.id))),
      });
    } catch (error) {
      throw new Error(`Could not import user_notes: ${error.message}`, {
        cause: error,
      });
    }
  }
  return values;
}

function equal(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right))
    return (
      left.length === right.length &&
      left.every((item, index) => equal(item, right[index]))
    );
  if (object(left) && object(right)) {
    const keys = Object.keys(left);
    return (
      keys.length === Object.keys(right).length &&
      keys.every(
        (key) => Object.hasOwn(right, key) && equal(left[key], right[key]),
      )
    );
  }
  return false;
}

function fieldPatch(before, after, excluded = []) {
  const set = {};
  const remove = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (excluded.includes(key) || equal(before[key], after[key])) continue;
    if (Object.hasOwn(after, key))
      Object.defineProperty(set, key, {
        value: clone(after[key]),
        enumerable: true,
      });
    else remove.push(key);
  }
  return { set, remove };
}

function entityPatch(before, after, recurring = false) {
  const previous = new Map(before.map((entry) => [entityKey(entry.id), entry]));
  const next = new Map(after.map((entry) => [entityKey(entry.id), entry]));
  const observedBefore = before
    .filter((entry) => next.has(entityKey(entry.id)))
    .map((entry) => entry.id);
  const observedAfter = after
    .filter((entry) => previous.has(entityKey(entry.id)))
    .map((entry) => entry.id);
  return {
    add: after.flatMap((entry, index) =>
      previous.has(entityKey(entry.id))
        ? []
        : [
            {
              value: clone(entry),
              beforeId: after[index + 1]?.id ?? null,
              afterId: after[index - 1]?.id ?? null,
            },
          ],
    ),
    update: after.flatMap((entry) => {
      const old = previous.get(entityKey(entry.id));
      if (!old || equal(old, entry)) return [];
      const fields = fieldPatch(
        old,
        entry,
        recurring ? ['id', 'completedDates'] : ['id'],
      );
      const dates = recurring
        ? {
            add: entry.completedDates.filter(
              (date) => !old.completedDates.includes(date),
            ),
            remove: old.completedDates.filter(
              (date) => !entry.completedDates.includes(date),
            ),
          }
        : null;
      return [
        {
          id: entry.id,
          ...fields,
          ...(dates ? { completedDates: dates } : {}),
        },
      ];
    }),
    remove: before
      .filter((entry) => !next.has(entityKey(entry.id)))
      .map((entry) => entry.id),
    order: equal(observedBefore, observedAfter) && after.every((entry) => previous.has(entityKey(entry.id)))
      ? []
      : after.map((entry) => entry.id),
  };
}

/** The patch contains intent relative to an observed snapshot, never a full array replacement. */
export function makeWorkspacePatch(before, after) {
  const previous = normalizeWorkspace(before);
  const next = normalizeWorkspace(after);
  const listMoves = {};
  const previousTasks = new Map(
    previous.tasks.tasks.map((task) => [task.id, task]),
  );
  for (const removed of previous.tasks.lists.filter(
    (list) => !next.tasks.lists.some((item) => item.id === list.id),
  )) {
    const destinations = new Set(
      next.tasks.tasks
        .filter(
          (task) =>
            previousTasks.get(task.id)?.listId === removed.id &&
            task.listId !== removed.id,
        )
        .map((task) => task.listId),
    );
    if (destinations.size === 1)
      Object.defineProperty(listMoves, removed.id, {
        value: [...destinations][0],
        enumerable: true,
      });
  }
  return {
    schemaVersion: 1,
    lists: entityPatch(previous.tasks.lists, next.tasks.lists),
    tasks: entityPatch(previous.tasks.tasks, next.tasks.tasks, true),
    bookmarks: entityPatch(previous.bookmarks, next.bookmarks),
    notes: entityPatch(previous.notes, next.notes),
    appearance: fieldPatch(previous.appearance, next.appearance),
    progress: Object.fromEntries(
      Object.keys(SOURCES).map((name) => [
        name,
        fieldPatch(previous.progress[name], next.progress[name]),
      ]),
    ),
    // Progress fields are per problem below, so a completion cannot overwrite a concurrent note.
    progressFields: Object.fromEntries(
      Object.keys(SOURCES).map((name) => [
        name,
        Object.fromEntries(
          Object.keys(next.progress[name])
            .filter(
              (id) =>
                Object.hasOwn(previous.progress[name], id) &&
                !equal(previous.progress[name][id], next.progress[name][id]),
            )
            .map((id) => [
              id,
              fieldPatch(previous.progress[name][id], next.progress[name][id]),
            ]),
        ),
      ]),
    ),
    listMoves,
  };
}

function applyFields(value, patch) {
  const result = clone(value);
  for (const key of patch.remove) delete result[key];
  for (const [key, entry] of Object.entries(patch.set))
    Object.defineProperty(result, key, {
      value: clone(entry),
      enumerable: true,
      configurable: true,
      writable: true,
    });
  return result;
}

function applyEntities(value, patch) {
  const removed = new Set(patch.remove.map(entityKey));
  let result = value
    .filter((entry) => !removed.has(entityKey(entry.id)))
    .map(clone);
  for (const update of patch.update) {
    result = result.map((entry) => {
      if (entityKey(entry.id) !== entityKey(update.id)) return entry;
      const next = applyFields(entry, update);
      if (update.completedDates) {
        const dates = new Set(next.completedDates);
        for (const date of update.completedDates.remove) dates.delete(date);
        for (const date of update.completedDates.add) dates.add(date);
        next.completedDates = [...dates].sort();
      }
      return next;
    });
  }
  for (const addition of patch.add) {
    if (
      result.some(
        (entry) => entityKey(entry.id) === entityKey(addition.value.id),
      )
    )
      continue;
    let index =
      addition.beforeId === null
        ? -1
        : result.findIndex(
            (entry) => entityKey(entry.id) === entityKey(addition.beforeId),
          );
    if (index < 0 && addition.afterId !== null) {
      const preceding = result.findIndex(
        (entry) => entityKey(entry.id) === entityKey(addition.afterId),
      );
      if (preceding >= 0) index = preceding + 1;
    }
    result.splice(index < 0 ? result.length : index, 0, clone(addition.value));
  }
  if (patch.order?.length) {
    const observed = new Map(
      result.map((entry) => [entityKey(entry.id), entry]),
    );
    const ordered = patch.order.flatMap((id) =>
      observed.has(entityKey(id)) ? [observed.get(entityKey(id))] : [],
    );
    const reorderedIds = new Set(ordered.map((entry) => entityKey(entry.id)));
    let index = 0;
    result = result.map((entry) =>
      reorderedIds.has(entityKey(entry.id)) ? ordered[index++] : entry,
    );
  }
  return result;
}

function repairTaskLists(data, listMoves) {
  const result = clone(data);
  const listIds = new Set(result.lists.map((list) => list.id));
  if (!result.tasks.some((task) => !listIds.has(task.listId))) return result;
  if (!result.lists.length) {
    result.lists.push({ id: 'inbox', name: 'Inbox', color: LIST_COLORS[0] });
    listIds.add('inbox');
  }
  result.tasks = result.tasks.map((task) =>
    listIds.has(task.listId)
      ? task
      : {
          ...task,
          listId:
            Object.hasOwn(listMoves, task.listId) &&
            listIds.has(listMoves[task.listId])
              ? listMoves[task.listId]
              : result.lists[0].id,
        },
  );
  return result;
}

/** Apply inside a Firestore transaction to the latest server document. */
export function applyWorkspacePatch(remote, patch) {
  const current = normalizeWorkspace(remote);
  assert(patch?.schemaVersion === 1, 'Unrecognized workspace patch');
  const progress = {};
  for (const name of Object.keys(SOURCES)) {
    const fields = patch.progress[name];
    const changedExisting = new Set(Object.keys(patch.progressFields[name]));
    const additions = Object.fromEntries(
      Object.entries(fields.set).filter(
        ([id]) =>
          !changedExisting.has(id) &&
          !Object.hasOwn(current.progress[name], id),
      ),
    );
    progress[name] = applyFields(current.progress[name], {
      set: additions,
      remove: fields.remove,
    });
    for (const [id, delta] of Object.entries(patch.progressFields[name])) {
      if (Object.hasOwn(progress[name], id))
        Object.defineProperty(progress[name], id, {
          value: applyFields(progress[name][id], delta),
          enumerable: true,
          configurable: true,
          writable: true,
        });
    }
  }
  return normalizeWorkspace({
    schemaVersion: 1,
    tasks: repairTaskLists(
      {
        version: 1,
        lists: applyEntities(current.tasks.lists, patch.lists),
        tasks: applyEntities(current.tasks.tasks, patch.tasks),
      },
      patch.listMoves || {},
    ),
    bookmarks: applyEntities(current.bookmarks, patch.bookmarks),
    notes: applyEntities(current.notes, patch.notes),
    appearance: applyFields(current.appearance, patch.appearance),
    progress,
  });
}
