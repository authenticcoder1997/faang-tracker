export const NOTES_STORAGE_KEY = 'faang-tracker-notes';

export function normalizeNotes(value) {
  if (!Array.isArray(value)) return [];
  const byId = new Map();
  for (const note of value) {
    if (!note || typeof note !== 'object') continue;
    if (!((typeof note.id === 'string' && note.id) || Number.isFinite(note.id)))
      continue;
    const normalized = {
      ...note,
      title: typeof note.title === 'string' ? note.title : '',
      content: typeof note.content === 'string' ? note.content : '',
      updatedAt: Number.isFinite(Date.parse(note.updatedAt))
        ? note.updatedAt
        : '1970-01-01T00:00:00.000Z',
    };
    const previous = byId.get(note.id);
    if (
      !previous ||
      Date.parse(normalized.updatedAt) >= Date.parse(previous.updatedAt)
    ) {
      byId.set(note.id, normalized);
    }
  }
  return [...byId.values()];
}

function emptyCache() {
  return {
    version: 1,
    notes: [],
    pendingIds: [],
    deletedIds: [],
    syncedIds: [],
  };
}

export function readNotesCache(storage) {
  try {
    if (!storage)
      return {
        cache: emptyCache(),
        hasCache: false,
        storageError: 'unavailable',
      };
    const raw = storage.getItem(NOTES_STORAGE_KEY);
    if (!raw)
      return { cache: emptyCache(), hasCache: false, storageError: null };
    const parsed = JSON.parse(raw);
    // The earlier tracker stored a plain array at this exact key.
    if (Array.isArray(parsed)) {
      const notes = normalizeNotes(parsed);
      return {
        cache: {
          ...emptyCache(),
          notes,
          pendingIds: notes.map((note) => note.id),
        },
        hasCache: true,
        storageError: null,
      };
    }
    if (parsed?.version !== 1 || !Array.isArray(parsed.notes))
      throw new Error('Invalid notes cache');
    return {
      cache: {
        version: 1,
        notes: normalizeNotes(parsed.notes),
        pendingIds: Array.isArray(parsed.pendingIds) ? parsed.pendingIds : [],
        deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
        syncedIds: Array.isArray(parsed.syncedIds) ? parsed.syncedIds : [],
      },
      hasCache: true,
      storageError: null,
    };
  } catch {
    return {
      cache: emptyCache(),
      hasCache: false,
      storageError: 'unavailable',
    };
  }
}

export function saveNotesCache(cache, storage) {
  try {
    if (!storage) return 'unavailable';
    storage.setItem(NOTES_STORAGE_KEY, JSON.stringify(cache));
    return null;
  } catch {
    return 'unavailable';
  }
}

function sameNote(left, right) {
  return (
    !!right &&
    left.title === right.title &&
    left.content === right.content &&
    left.updatedAt === right.updatedAt
  );
}

export function updateNotesCache(cache, value) {
  const notes = normalizeNotes(value);
  const nextIds = new Set(notes.map((note) => note.id));
  const deletedIds = new Set(cache.deletedIds);
  for (const note of cache.notes) {
    if (!nextIds.has(note.id)) deletedIds.add(note.id);
  }
  const previous = new Map(cache.notes.map((note) => [note.id, note]));
  const pendingIds = new Set(cache.pendingIds);
  for (const note of notes) {
    deletedIds.delete(note.id);
    if (!sameNote(note, previous.get(note.id))) pendingIds.add(note.id);
  }
  return {
    ...cache,
    notes,
    pendingIds: [...pendingIds].filter((id) => nextIds.has(id)),
    deletedIds: [...deletedIds],
  };
}

export function mergeCloudNotes(cache, value, allowCloudDeletes = false) {
  const cloudNotes = normalizeNotes(value);
  const cloud = new Map(cloudNotes.map((note) => [note.id, note]));
  const pending = new Set(cache.pendingIds);
  const deleted = new Set(cache.deletedIds);
  const synced = new Set(cache.syncedIds);
  const notes = [];
  for (const local of cache.notes) {
    if (deleted.has(local.id)) continue;
    const remote = cloud.get(local.id);
    if (!remote) {
      // Only a confirmed server snapshot may remove an unchanged synced note.
      if (!allowCloudDeletes || pending.has(local.id) || !synced.has(local.id))
        notes.push(local);
    } else {
      notes.push(
        pending.has(local.id) ||
          Date.parse(local.updatedAt) >= Date.parse(remote.updatedAt)
          ? local
          : remote,
      );
      cloud.delete(local.id);
    }
  }
  for (const remote of cloud.values()) {
    if (!deleted.has(remote.id)) notes.push(remote);
  }
  return { ...cache, notes };
}

export function notesMatchCloud(cache, value) {
  const cloud = new Map(normalizeNotes(value).map((note) => [note.id, note]));
  return (
    cloud.size === cache.notes.length &&
    cache.notes.every((note) => sameNote(note, cloud.get(note.id)))
  );
}

export function markNotesSynced(cache) {
  return {
    ...cache,
    pendingIds: [],
    syncedIds: cache.notes.map((note) => note.id),
  };
}

export function reconcileNotesSnapshot(cache, value, confirmed = false) {
  const next = mergeCloudNotes(cache, value, confirmed);
  const matches = notesMatchCloud(next, value);
  return {
    cache: confirmed && matches ? markNotesSynced(next) : next,
    // An offline snapshot cannot establish which other-device notes exist.
    shouldWrite: confirmed && !matches,
  };
}
