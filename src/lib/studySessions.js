export function activeStudySession(sessions) {
  return sessions.find((session) => session.stoppedAt === null);
}

export function normalizeStudySession(value) {
  const { id, startedAt, stoppedAt, durationMs } = value ?? {};
  const validTime = (time) => Number.isSafeInteger(time) && time >= 0 && time <= 8640000000000000;
  if (typeof id !== 'string' || !id || id.length > 300 || !validTime(startedAt) ||
      (stoppedAt !== null && (!validTime(stoppedAt) || stoppedAt < startedAt)) ||
      (durationMs !== undefined && (startedAt !== stoppedAt || !Number.isSafeInteger(durationMs) ||
        durationMs <= 0 || durationMs > 86_400_000))) {
    throw new Error('Invalid study session');
  }
  return { id, startedAt, stoppedAt, ...(durationMs !== undefined ? { durationMs } : {}) };
}

function appendStudySession(sessions, session) {
  return sessions.some(({ id }) => id === session.id) ? sessions : [...sessions, session];
}

export function logStudyTime(sessions, id, durationMs, loggedAt) {
  const session = normalizeStudySession({ id, startedAt: loggedAt, stoppedAt: loggedAt, durationMs });
  return appendStudySession(sessions, session);
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

export function diffStudySessions(previous, next) {
  if (previous === next) return null;
  const before = activeStudySession(previous);
  const after = activeStudySession(next);
  const activeChanged = before?.id !== after?.id;
  const previousIds = new Set(previous.map((session) => session.id));
  const nextIds = new Set(next.map((session) => session.id));
  const add = next.filter((session) => session.stoppedAt !== null && !previousIds.has(session.id));
  const remove = previous.filter((session) => session.stoppedAt !== null && !nextIds.has(session.id))
    .map((session) => session.id);
  if (!activeChanged && !add.length && !remove.length) return null;
  const stopped = activeChanged && before
    ? next.find((session) => session.id === before.id && session.stoppedAt !== null)
    : null;
  return {
    start: activeChanged ? after ?? null : null,
    stop: stopped ?? null,
    add,
    remove,
  };
}

export function applyStudySessionPatch(sessions, patch) {
  const remaining = patch?.remove?.reduce(deleteStudySession, sessions) ?? sessions;
  const stopped = patch?.stop ? stopStudySession(remaining, patch.stop.id, patch.stop.stoppedAt) : remaining;
  const logged = patch?.add?.reduce(appendStudySession, stopped) ?? stopped;
  return patch?.start ? startStudySession(logged, patch.start.id, patch.start.startedAt) : logged;
}
