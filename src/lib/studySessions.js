export function activeStudySession(sessions) {
  return sessions.find((session) => session.stoppedAt === null);
}

export function normalizeStudySession(value) {
  const { id, startedAt, stoppedAt } = value ?? {};
  const validTime = (time) => Number.isSafeInteger(time) && time >= 0 && time <= 8640000000000000;
  if (typeof id !== 'string' || !id || id.length > 300 || !validTime(startedAt) ||
      (stoppedAt !== null && (!validTime(stoppedAt) || stoppedAt < startedAt))) {
    throw new Error('Invalid study session');
  }
  return { id, startedAt, stoppedAt };
}

export function startStudySession(sessions, id, startedAt) {
  if (activeStudySession(sessions) || sessions.some((session) => session.id === id)) return sessions;
  return [...sessions, { id, startedAt, stoppedAt: null }];
}

export function stopStudySession(sessions, id, now) {
  const active = activeStudySession(sessions);
  if (!active || active.id !== id) return sessions;
  return sessions.map((session) => session === active
    ? { ...session, stoppedAt: Math.max(session.startedAt, now) }
    : session);
}

export function diffStudySessions(previous, next) {
  if (previous === next) return null;
  const before = activeStudySession(previous);
  const after = activeStudySession(next);
  if (before?.id === after?.id) return null;
  return {
    start: after ?? null,
    stop: (before && next.find((session) => session.id === before.id && session.stoppedAt !== null)) ?? null,
  };
}

export function applyStudySessionPatch(sessions, patch) {
  const stopped = patch?.stop ? stopStudySession(sessions, patch.stop.id, patch.stop.stoppedAt) : sessions;
  return patch?.start ? startStudySession(stopped, patch.start.id, patch.start.startedAt) : stopped;
}
