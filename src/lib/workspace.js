import { normalizeDsaRevision } from './dsaRevision.js';
import { normalizeHomeworkPlan } from './homeworkSchedule.js';
import { applyStudySessionPatch, diffStudySessions, normalizeStudySession } from './studySessions.js';
import { normalizeBookmark } from './bookmarks.js';
import { isValidDate, LIST_COLORS, normalizeTaskLinks, validateTaskData } from './tasks.js';
import { isValidTheme } from './theme.js';

export const PROGRESS_TRACKS = Object.freeze(['dsa', 'lld', 'hld', 'concurrency']);

export function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// A workspace is JSON data. Reject unsupported values instead of silently
// removing them before an authoritative cloud write.
export function clone(value) {
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

export function entityKey(id) {
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

export function tasks(value) {
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
      ...(task.links !== undefined ? { links: normalizeTaskLinks(task.links) } : {}),
    };
  });
  return data;
}

export function bookmarks(value) {
  return uniqueEntities(value, 'bookmark', (bookmark) => {
    const next = normalizeBookmark(bookmark);
    assert(next, 'Invalid bookmark');
    return next;
  });
}

export function notes(value) {
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

export function appearance(value) {
  assert(object(value) && isValidTheme(value), 'Invalid appearance');
  const { mode, palette, material } = value;
  return { mode, palette, ...(material === undefined ? {} : { material }) };
}

function progressState(value) {
  assert(object(value), 'Invalid study progress');
  return Object.fromEntries(
    Object.entries(value).map(([id, state]) => {
      assert(
        id &&
          object(state) &&
          typeof state.completed === 'boolean' &&
          (state.note === undefined || typeof state.note === 'string') &&
          (state.homeworkDate === undefined || isValidDate(state.homeworkDate)),
        'Invalid problem progress',
      );
      return [id, {
        completed: state.completed,
        note: state.note ?? '',
        ...(state.completed && state.homeworkDate ? { homeworkDate: state.homeworkDate } : {}),
      }];
    }),
  );
}

function studySessions(value = []) {
  const sessions = uniqueEntities(value, 'study session', normalizeStudySession);
  assert(sessions.filter((session) => session.stoppedAt === null).length <= 1, 'Multiple active study sessions');
  return sessions;
}

/** Validate a complete cloud document without replacing unreadable data. */
export function normalizeWorkspace(value, previous) {
  assert(
    object(value) && value.schemaVersion === 1,
    'Unrecognized workspace version',
  );
  assert(object(value.progress), 'Invalid study progress');
  return {
    schemaVersion: 1,
    tasks: previous && value.tasks === previous.tasks ? previous.tasks : tasks(value.tasks),
    bookmarks: previous && value.bookmarks === previous.bookmarks ? previous.bookmarks : bookmarks(value.bookmarks),
    homework: previous && value.homework === previous.homework
      ? previous.homework : normalizeHomeworkPlan(value.homework),
    studySessions: previous && value.studySessions === previous.studySessions
      ? previous.studySessions : studySessions(value.studySessions),
    revisions: previous && value.revisions === previous.revisions ? previous.revisions
      : uniqueEntities(value.revisions === undefined ? [] : value.revisions, 'DSA revisions', normalizeDsaRevision),
    notes: previous && value.notes === previous.notes ? previous.notes : notes(value.notes),
    appearance: previous && value.appearance === previous.appearance ? previous.appearance : appearance(value.appearance),
    progress: Object.fromEntries(
      PROGRESS_TRACKS.map((name) => [
        name,
        previous && value.progress[name] === previous.progress[name]
          ? previous.progress[name]
          : progressState(value.progress[name]),
      ]),
    ),
  };
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

const SECTIONS = ['tasks', 'bookmarks', 'notes', 'appearance', 'revisions', 'homework', 'studySessions'];

// Keep unchanged sections referentially stable across cloud snapshots and acks.
export function reuseWorkspace(previous, next) {
  if (!previous || previous === next) return next;
  const result = { ...next, progress: { ...next.progress } };
  for (const section of SECTIONS) {
    if (equal(previous[section], next[section])) result[section] = previous[section];
  }
  for (const track of PROGRESS_TRACKS) {
    if (equal(previous.progress[track], next.progress[track])) result.progress[track] = previous.progress[track];
  }
  if (PROGRESS_TRACKS.every((track) => result.progress[track] === previous.progress[track]))
    result.progress = previous.progress;
  return workspaceChanges(previous, result).length ? result : previous;
}

export function workspaceChanges(previous, next) {
  return [
    ...SECTIONS.filter((key) => previous[key] !== next[key]),
    ...PROGRESS_TRACKS.filter((key) => previous.progress[key] !== next.progress[key]),
  ];
}

export function workspaceWriteFields(previous, next) {
  return Object.fromEntries(workspaceChanges(previous, next).map((key) =>
    PROGRESS_TRACKS.includes(key) ? [`progress.${key}`, next.progress[key]] : [key, next[key]],
  ));
}

function fieldPatch(before, after, excluded = []) {
  if (before === after) return { set: {}, remove: [] };
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
  if (before === after) return { add: [], update: [], remove: [], order: [] };
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
  return diffWorkspace(normalizeWorkspace(before), normalizeWorkspace(after));
}

// Both inputs here have already been validated.
export function diffWorkspace(previous, next) {
  const listMoves = {};
  const removedLists = previous.tasks.lists === next.tasks.lists ? [] : previous.tasks.lists.filter(
    (list) => !next.tasks.lists.some((item) => item.id === list.id),
  );
  const previousTasks = new Map(removedLists.length ? previous.tasks.tasks.map((task) => [task.id, task]) : []);
  for (const removed of removedLists) {
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
    revisions: entityPatch(previous.revisions, next.revisions),
    homework: equal(previous.homework, next.homework) ? null : next.homework,
    studySessions: diffStudySessions(previous.studySessions, next.studySessions),
    notes: entityPatch(previous.notes, next.notes),
    appearance: fieldPatch(previous.appearance, next.appearance),
    progress: Object.fromEntries(
      PROGRESS_TRACKS.map((name) => [
        name,
        fieldPatch(previous.progress[name], next.progress[name]),
      ]),
    ),
    // Progress fields are per problem below, so a completion cannot overwrite a concurrent note.
    progressFields: Object.fromEntries(
      PROGRESS_TRACKS.map((name) => [
        name,
        Object.fromEntries(
          (previous.progress[name] === next.progress[name] ? [] : Object.keys(next.progress[name]))
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

function hasFieldChanges(patch) {
  return patch.remove.length > 0 || Object.keys(patch.set).length > 0;
}

function applyFields(value, patch) {
  if (!hasFieldChanges(patch)) return value;
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
  if (!patch.remove.length && !patch.update.length && !patch.add.length && !patch.order?.length)
    return value;
  const removed = new Set(patch.remove.map(entityKey));
  let result = value.filter((entry) => !removed.has(entityKey(entry.id)));
  for (const update of patch.update) {
    result = result.map((entry) => {
      if (entityKey(entry.id) !== entityKey(update.id)) return entry;
      const next = { ...applyFields(entry, update) };
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
  const listIds = new Set(data.lists.map((list) => list.id));
  if (!data.tasks.some((task) => !listIds.has(task.listId))) return data;
  const lists = data.lists.length ? data.lists : [{ id: 'inbox', name: 'Inbox', color: LIST_COLORS[0] }];
  if (!data.lists.length) {
    listIds.add('inbox');
  }
  const tasks = data.tasks.map((task) =>
    listIds.has(task.listId)
      ? task
      : {
          ...task,
          listId:
            Object.hasOwn(listMoves, task.listId) &&
            listIds.has(listMoves[task.listId])
              ? listMoves[task.listId]
              : lists[0].id,
        },
  );
  return { ...data, lists, tasks };
}

/** Apply inside a Firestore transaction to the latest server document. */
export function applyWorkspacePatch(remote, patch) {
  return applyValidatedWorkspacePatch(normalizeWorkspace(remote), patch);
}

export function applyValidatedWorkspacePatch(current, patch) {
  assert(patch?.schemaVersion === 1, 'Unrecognized workspace patch');
  const progress = {};
  for (const name of PROGRESS_TRACKS) {
    const fields = patch.progress[name];
    const changedExisting = new Set(Object.keys(patch.progressFields[name]));
    if (!changedExisting.size && !hasFieldChanges(fields)) {
      progress[name] = current.progress[name];
      continue;
    }
    const additions = Object.fromEntries(
      Object.entries(fields.set).flatMap(([id, state]) => {
        if (changedExisting.has(id)) return [];
        if (!Object.hasOwn(current.progress[name], id)) return [[id, state]];
        const existing = current.progress[name][id];
        // A first-time note and Homework completion can arrive in either order.
        if (state.homeworkDate && !existing.completed)
          return [[id, { ...existing, completed: true, homeworkDate: state.homeworkDate }]];
        if (existing.homeworkDate && !existing.note && state.note)
          return [[id, { ...existing, note: state.note }]];
        return [];
      }),
    );
    progress[name] = { ...applyFields(current.progress[name], {
      set: additions,
      remove: fields.remove,
    }) };
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
  const lists = applyEntities(current.tasks.lists, patch.lists);
  const tasks = applyEntities(current.tasks.tasks, patch.tasks);
  const savedPlan = current.homework;
  const incomingPlan = patch.homework;
  // A duplicate click or a stale device must never replace today's active batch.
  const homework = incomingPlan && (!savedPlan || incomingPlan.date > savedPlan.date ||
    (incomingPlan.date === savedPlan.date && incomingPlan.round > savedPlan.round))
    ? incomingPlan : savedPlan;
  return normalizeWorkspace({
    schemaVersion: 1,
    tasks: lists === current.tasks.lists && tasks === current.tasks.tasks
      ? current.tasks
      : repairTaskLists({ version: 1, lists, tasks }, patch.listMoves || {}),
    bookmarks: applyEntities(current.bookmarks, patch.bookmarks),
    homework,
    studySessions: applyStudySessionPatch(current.studySessions, patch.studySessions),
    revisions: patch.revisions ? applyEntities(current.revisions, patch.revisions) : current.revisions,
    notes: applyEntities(current.notes, patch.notes),
    appearance: applyFields(current.appearance, patch.appearance),
    progress,
  }, current);
}
