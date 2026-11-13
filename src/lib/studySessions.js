import { addDays, dateKey, isValidDate } from './tasks.js';

export function activeStudySession(sessions) {
  return sessions.find((session) => session.stoppedAt === null);
}

export function normalizeStudySession(value) {
  const { id, startedAt, stoppedAt, durationMs, studyDate } = value ?? {};
  const validTime = (time) => Number.isSafeInteger(time) && time >= 0 && time <= 8640000000000000;
  if (typeof id !== 'string' || !id || id.length > 300 || !validTime(startedAt) ||
      (stoppedAt !== null && (!validTime(stoppedAt) || stoppedAt < startedAt)) ||
      (durationMs !== undefined && (startedAt !== stoppedAt || !Number.isSafeInteger(durationMs) ||
        durationMs <= 0 || durationMs > 86_400_000)) ||
      (studyDate !== undefined && (durationMs === undefined || !isValidDate(studyDate)))) {
    throw new Error('Invalid study session');
  }
  return { id, startedAt, stoppedAt, ...(durationMs !== undefined ? { durationMs } : {}),
    ...(studyDate !== undefined ? { studyDate } : {}) };
}

function appendStudySession(sessions, session) {
  return sessions.some(({ id }) => id === session.id) ? sessions : [...sessions, session];
}

export function logStudyTime(sessions, id, durationMs, loggedAt, studyDate) {
  const session = normalizeStudySession({ id, startedAt: loggedAt, stoppedAt: loggedAt, durationMs, studyDate });
  return appendStudySession(sessions, session);
}

export function studySessionDate(session) {
  return session.studyDate ?? dateKey(new Date(session.startedAt));
}

export function studySessionsByDate(sessions, firstDate, lastDate = firstDate) {
  const days = new Map();
  const rangeStart = new Date(`${firstDate}T00:00:00`).getTime();
  const rangeEnd = new Date(`${addDays(lastDate, 1)}T00:00:00`).getTime();

  function record(date, entry) {
    if (!days.has(date)) days.set(date, []);
    days.get(date).push(entry);
  }

  for (const session of sessions) {
    const { startedAt, stoppedAt, durationMs } = session;
    if (stoppedAt === null) continue;
    if (durationMs !== undefined) {
      const date = studySessionDate(session);
      if (date >= firstDate && date <= lastDate) {
        record(date, { session, start: startedAt, end: stoppedAt, duration: durationMs });
      }
      continue;
    }
    let start = Math.max(startedAt, rangeStart);
    const stop = Math.min(stoppedAt, rangeEnd);
    if (startedAt === stoppedAt && startedAt >= rangeStart && startedAt < rangeEnd) {
      record(studySessionDate(session), { session, start, end: stop, duration: 0 });
    }
    while (start < stop) {
      const day = new Date(start);
      const date = dateKey(day);
      const end = Math.min(stop, day.setHours(24, 0, 0, 0));
      record(date, { session, start, end, duration: end - start });
      start = end;
    }
  }
  return days;
}

export function startStudySession(sessions, id, startedAt) {
  return activeStudySession(sessions) ? sessions : appendStudySession(sessions, { id, startedAt, stoppedAt: null });
}

export function stopStudySession(sessions, id, now) {
  const active = activeStudySession(sessions);
  if (!active || active.id !== id) return sessions;
  return sessions.map((session) => session === active
    ? { ...session, stoppedAt: Math.max(session.startedAt, now) }
    : session);
}

export function deleteStudySession(sessions, id) {
  const entry = sessions.find((session) => session.id === id && session.stoppedAt !== null);
  return entry ? sessions.filter((session) => session !== entry) : sessions;
}

function sameStudyTime(first, second) {
  return first.startedAt === second.startedAt && first.stoppedAt === second.stoppedAt &&
    first.durationMs === second.durationMs && first.studyDate === second.studyDate;
}

function replaceStudySession(sessions, edited) {
  const entry = sessions.find(({ id, stoppedAt }) => id === edited.id && stoppedAt !== null);
  if (!entry || edited.stoppedAt === null || sameStudyTime(entry, edited)) return sessions;
  const updated = normalizeStudySession(edited);
  return sessions.map((session) => session === entry ? updated : session);
}

export function editStudySession(sessions, id, durationMs, studyDate) {
  const entry = sessions.find((session) => session.id === id && session.stoppedAt !== null);
  if (!entry) return sessions;
  const duration = entry.durationMs ?? (entry.stoppedAt - entry.startedAt);
  if (duration === durationMs && studySessionDate(entry) === studyDate) return sessions;
  return replaceStudySession(sessions, {
    id, startedAt: entry.startedAt, stoppedAt: entry.startedAt, durationMs, studyDate,
  });
}

export function diffStudySessions(previous, next) {
  if (previous === next) return null;
  const before = activeStudySession(previous);
  const after = activeStudySession(next);
  const activeChanged = before?.id !== after?.id;
  const previousById = new Map(previous.map((session) => [session.id, session]));
  const nextIds = new Set(next.map((session) => session.id));
  const add = next.filter((session) => session.stoppedAt !== null && !previousById.has(session.id));
  const update = next.filter((session) => {
    const previousEntry = previousById.get(session.id);
    return session.stoppedAt !== null && previousEntry && previousEntry.stoppedAt !== null &&
      !sameStudyTime(previousEntry, session);
  });
  const remove = previous.filter((session) => session.stoppedAt !== null && !nextIds.has(session.id))
    .map((session) => session.id);
  if (!activeChanged && !add.length && !remove.length && !update.length) return null;
  const stopped = activeChanged && before
    ? next.find((session) => session.id === before.id && session.stoppedAt !== null)
    : null;
  return {
    start: activeChanged ? after ?? null : null,
    stop: stopped ?? null,
    add,
    remove,
    update,
  };
}

export function applyStudySessionPatch(sessions, patch) {
  const remaining = patch?.remove?.reduce(deleteStudySession, sessions) ?? sessions;
  const stopped = patch?.stop ? stopStudySession(remaining, patch.stop.id, patch.stop.stoppedAt) : remaining;
  const logged = patch?.add?.reduce(appendStudySession, stopped) ?? stopped;
  const edited = patch?.update?.reduce(replaceStudySession, logged) ?? logged;
  return patch?.start ? startStudySession(edited, patch.start.id, patch.start.startedAt) : edited;
}
