const NOTE_FIELDS = ['title', 'content'];

export function createNoteDraft(id = null) {
  return { id, fields: {}, baseline: {} };
}

/** Track only fields the user changed from the value they began editing. */
export function editNoteDraft(draft, note, field, value) {
  if (!NOTE_FIELDS.includes(field)) return draft;
  const current = draft.id === note.id ? draft : createNoteDraft(note.id);
  const baseline = Object.hasOwn(current.baseline, field)
    ? current.baseline[field]
    : note[field] || '';
  const next = {
    id: note.id,
    fields: { ...current.fields },
    baseline: { ...current.baseline },
  };
  if (value === baseline) {
    delete next.fields[field];
    delete next.baseline[field];
  } else {
    next.fields[field] = value;
    next.baseline[field] = baseline;
  }
  return next;
}

/** Apply local fields to the latest note, preserving all remotely edited fields. */
export function applyNoteDraft(notes, draft, now = new Date().toISOString()) {
  const fields = NOTE_FIELDS.filter((field) => Object.hasOwn(draft.fields, field));
  if (!fields.length) return notes;
  let changed = false;
  const next = notes.map((note) => {
    if (note.id !== draft.id || fields.every((field) => note[field] === draft.fields[field]))
      return note;
    changed = true;
    return {
      ...note,
      ...Object.fromEntries(fields.map((field) => [field, draft.fields[field]])),
      updatedAt: now,
    };
  });
  return changed ? next : notes;
}
