import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Play, Square, Timer, Trash2 } from 'lucide-react';
import { useWorkspace, useWorkspaceValue } from '../hooks/useWorkspace';
import { activeStudySession, deleteStudySession, startStudySession, stopStudySession } from '../lib/studySessions';

const sessionDate = new Intl.DateTimeFormat('en', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
});

function nextLocalMidnight(timestamp) {
  return new Date(timestamp).setHours(24, 0, 0, 0);
}

function durationParts(ms) {
  const seconds = Math.floor(ms / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60];
}

function durationLabel(ms) {
  const [hours, minutes, seconds] = durationParts(ms);
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

function DeleteSessionDialog({ session, onCancel, onConfirm }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog ref={dialog} aria-labelledby="delete-study-title" aria-describedby="delete-study-detail"
      onCancel={onCancel}
      className="task-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line p-5 sm:p-6">
      <h2 id="delete-study-title" className="text-lg font-semibold">Delete this study session?</h2>
      <div id="delete-study-detail" className="mt-3 space-y-2 text-sm text-muted">
        <p>{sessionDate.formatRange(session.startedAt, session.stoppedAt)} · {durationLabel(session.stoppedAt - session.startedAt)}</p>
        <p>This removes the entire session from your study history.</p>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" className="button-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="button-secondary !border-danger/30 !text-danger hover:!bg-danger/10"
          onClick={onConfirm}>
          <Trash2 size={15} aria-hidden="true" /> Delete session
        </button>
      </div>
    </dialog>
  );
}

export default function StudyTimer({ isActive }) {
  const { updateData } = useWorkspace();
  const sessions = useWorkspaceValue((state) => state.data.studySessions);
  const [now, setNow] = useState(Date.now);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const active = useMemo(() => activeStudySession(sessions), [sessions]);
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const { history, studiedToday } = useMemo(() => {
    const todayEnd = nextLocalMidnight(todayStart);
    const history = sessions.flatMap((session) => {
      const { startedAt, stoppedAt } = session;
      if (stoppedAt === null || startedAt >= todayEnd ||
          (startedAt < todayStart && stoppedAt <= todayStart)) return [];
      return [{ session, start: Math.max(startedAt, todayStart), end: Math.min(stoppedAt, todayEnd) }];
    }).sort((first, second) => second.session.startedAt - first.session.startedAt);
    const studiedToday = history.reduce((sum, { start, end }) => sum + end - start, 0);
    return { history, studiedToday };
  }, [sessions, todayStart]);

  useEffect(() => {
    if (!isActive) return;
    let timer;
    function tick() {
      const timestamp = Date.now();
      setNow(timestamp);
      timer = window.setTimeout(tick, active ? 1000 : nextLocalMidnight(timestamp) - timestamp);
    }
    tick();
    return () => window.clearTimeout(timer);
  }, [active, isActive]);

  function saveSessions(change) {
    return updateData((current) => {
      const next = change(current.studySessions);
      return next === current.studySessions ? current : { ...current, studySessions: next };
    });
  }

  function start() {
    const id = crypto.randomUUID();
    const startedAt = Date.now();
    setNow(startedAt);
    saveSessions((current) => startStudySession(current, id, startedAt));
  }

  function stop() {
    const stoppedAt = Date.now();
    setNow(stoppedAt);
    if (saveSessions((current) => stopStudySession(current, active.id, stoppedAt))) setShowHistory(true);
  }

  function remove(session) {
    if (saveSessions((current) => deleteStudySession(current, session.id))) setPendingDeletion(null);
  }

  const elapsed = active ? Math.max(0, now - active.startedAt) : 0;

  return (
    <section aria-labelledby="study-timer-title" className="panel px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-3">
          <Timer size={20} className="shrink-0 text-accent" aria-hidden="true" />
          <div>
            <h3 id="study-timer-title" className="section-heading">Study timer</h3>
            <p className="mt-0.5 text-xs text-muted">{active ? 'Session running' : 'Ready to study'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span role="timer" aria-label="Current session" className="text-xl font-semibold tabular-nums text-ink">
            {durationParts(elapsed).map((part) => String(part).padStart(2, '0')).join(':')}
          </span>
          <button type="button" className="button-primary" onClick={active ? stop : start}>
            {active ? <Square size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            {active ? 'Stop' : 'Start'}
          </button>
        </div>
        <div>
          <p className="text-xs text-muted">Studied today</p>
          <p className="mt-0.5 font-semibold tabular-nums text-ink">{durationLabel(studiedToday)}</p>
        </div>
        <button type="button" className="button-secondary" aria-expanded={showHistory}
          aria-controls="study-session-history" onClick={() => setShowHistory(!showHistory)}>
          Today’s history <span className="tabular-nums text-muted">{history.length}</span>
          <ChevronDown size={14} aria-hidden="true" className={showHistory ? 'rotate-180' : ''} />
        </button>
      </div>
      <div id="study-session-history" hidden={!showHistory} className="mt-4 border-t border-line pt-2">
        {history.length ? (
          <ul aria-label="Today’s study sessions" className="max-h-60 divide-y divide-line overflow-y-auto">
            {history.map(({ session, start, end }) => (
              <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-muted">
                  {sessionDate.formatRange(start, end)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums text-ink">
                    {durationLabel(end - start)}
                  </span>
                  <button type="button" className="icon-button hover:text-danger"
                    aria-label={`Delete study session from ${sessionDate.format(session.startedAt)}`}
                    title="Delete study session" onClick={() => setPendingDeletion(session)}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="py-3 text-sm text-muted">No study sessions today.</p>}
      </div>
      {isActive && pendingDeletion && (
        <DeleteSessionDialog session={pendingDeletion}
          onCancel={() => setPendingDeletion(null)} onConfirm={() => remove(pendingDeletion)} />
      )}
    </section>
  );
}
