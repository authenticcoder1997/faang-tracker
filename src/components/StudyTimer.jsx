import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Play, Square, Timer } from 'lucide-react';
import { useWorkspace, useWorkspaceValue } from '../hooks/useWorkspace';
import { activeStudySession, startStudySession, stopStudySession } from '../lib/studySessions';

const sessionDate = new Intl.DateTimeFormat('en', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
});

function durationParts(ms) {
  const seconds = Math.floor(ms / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60];
}

function durationLabel(ms) {
  const [hours, minutes, seconds] = durationParts(ms);
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export default function StudyTimer({ isActive }) {
  const { updateData } = useWorkspace();
  const sessions = useWorkspaceValue((state) => state.data.studySessions);
  const [now, setNow] = useState(Date.now);
  const [showHistory, setShowHistory] = useState(false);
  const { active, history, total } = useMemo(() => {
    const history = sessions.filter((session) => session.stoppedAt !== null)
      .sort((first, second) => second.startedAt - first.startedAt);
    return {
      active: activeStudySession(sessions),
      history,
      total: history.reduce((sum, session) => sum + (session.stoppedAt - session.startedAt), 0),
    };
  }, [sessions]);

  useEffect(() => {
    if (!active || !isActive) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
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
    if (saveSessions((current) => stopStudySession(current, active.id, stoppedAt))) setShowHistory(true);
  }

  const elapsed = active ? Math.max(0, now - active.startedAt) : 0;

  return (
    <section aria-labelledby="study-timer-title" className="panel mb-8 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-3">
          <Timer size={20} className="shrink-0 text-accent" aria-hidden="true" />
          <div>
            <h2 id="study-timer-title" className="section-heading">Study timer</h2>
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
          <p className="text-xs text-muted">Total studied</p>
          <p className="mt-0.5 font-semibold tabular-nums text-ink">{durationLabel(total)}</p>
        </div>
        <button type="button" className="button-secondary" aria-expanded={showHistory}
          aria-controls="study-session-history" onClick={() => setShowHistory(!showHistory)}>
          History <span className="tabular-nums text-muted">{history.length}</span>
          <ChevronDown size={14} aria-hidden="true" className={showHistory ? 'rotate-180' : ''} />
        </button>
      </div>
      <div id="study-session-history" hidden={!showHistory} className="mt-4 border-t border-line pt-2">
        {history.length ? (
          <ul aria-label="Study sessions" className="max-h-60 divide-y divide-line overflow-y-auto">
            {history.map((session) => (
              <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-muted">
                  {sessionDate.formatRange(session.startedAt, session.stoppedAt)}
                </span>
                <span className="font-medium tabular-nums text-ink">
                  {durationLabel(session.stoppedAt - session.startedAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="py-3 text-sm text-muted">No study sessions yet.</p>}
      </div>
    </section>
  );
}
