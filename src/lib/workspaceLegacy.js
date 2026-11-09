import { dsaTopics } from '../data/dsaTopics.js';
import { lldTopics } from '../data/lldTopics.js';
import { hldTopics } from '../data/hldTopics.js';
import { concurrencyTopics } from '../data/concurrencyTopics.js';
import { importantBookmarks } from '../data/importantBookmarks.js';
import { INITIAL_TASK_DATA } from './tasks.js';
import { appearance, assert, bookmarks, clone, entityKey, normalizeWorkspace, notes, object, tasks } from './workspace.js';

const SOURCES = {
  dsa: dsaTopics,
  lld: lldTopics,
  hld: hldTopics,
  concurrency: concurrencyTopics,
};
import { LEGACY_STORAGE_KEYS, PROGRESS_KEYS } from './workspaceLegacyKeys.js';

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
              ...remote,
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
