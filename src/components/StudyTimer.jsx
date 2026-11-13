import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Play, Plus, Square, Timer, Trash2 } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import {
  activeStudySession, deleteStudySession, logStudyTime, startStudySession, stopStudySession, studySessionsByDate,
} from '../lib/studySessions';
import { dateKey, isValidDate } from '../lib/tasks';

const sessionDate = new Intl.DateTimeFormat('en', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
});

const studyDay = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' });

function durationParts(ms) {
  const seconds = Math.floor(ms / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60];
}

function durationLabel(ms) {
  const [hours, minutes, seconds] = durationParts(ms);
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

function AddStudyTimeDialog({ date, today, onCancel, onSave }) {
  const dialog = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const minutes = Number(fields.get('hours')) * 60 + Number(fields.get('minutes'));
    const studyDate = fields.get('date');
    if (!isValidDate(studyDate) || studyDate > dateKey()) {
      setError('Choose today or an earlier date.');
      return;
    }
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 24 * 60) {
      setError('Enter a duration between 1 minute and 24 hours.');
      return;
    }
    onSave(minutes * 60_000, studyDate);
  }

  return (
    <dialog ref={dialog} aria-labelledby="add-study-title" onCancel={onCancel}
      className="task-dialog m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line p-5 sm:p-6">
      <h2 id="add-study-title" className="text-lg font-semibold">Add study time</h2>
      <form onSubmit={submit} onChange={() => setError('')} className="mt-3">
        <label className="block text-xs font-medium text-muted">
          Date studied
          <input type="date" name="date" defaultValue={date} max={today} required className="input-control mt-1" />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-muted">
            Hours
            <input type="number" name="hours" min="0" max="24" step="1" inputMode="numeric"
              placeholder="0" className="input-control mt-1" />
          </label>
          <label className="text-xs font-medium text-muted">
            Minutes
            <input type="number" name="minutes" min="0" max="59" step="1" inputMode="numeric"
              placeholder="0" className="input-control mt-1" />
          </label>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="button-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="button-primary">Save time</button>
        </div>
      </form>
    </dialog>
  );
}

function DeleteSessionDialog({ session, onCancel, onConfirm }) {
  const dialog = useRef(null);
  const label = session.durationMs ? 'Manual entry' : sessionDate.formatRange(session.startedAt, session.stoppedAt);
  const duration = session.durationMs ?? (session.stoppedAt - session.startedAt);
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
        <p>{label} · {durationLabel(duration)}</p>
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

export default function StudyTimer({ date, today, isActive, sessions, onSelectDate }) {
  const { updateData } = useWorkspace();
  const [now, setNow] = useState(Date.now);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddTime, setShowAddTime] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const active = useMemo(() => activeStudySession(sessions), [sessions]);
  const isToday = date === today;
  const dateLabel = studyDay.format(new Date(`${date}T12:00:00`));
  const { history, studied } = useMemo(() => {
    const history = (studySessionsByDate(sessions, date).get(date) ?? [])
      .sort((first, second) => second.start - first.start);
    return { history, studied: history.reduce((sum, { duration }) => sum + duration, 0) };
  }, [sessions, date]);

  useEffect(() => {
    if (!isActive || !isToday || !active) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [active, isActive, isToday]);

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

  function addTime(durationMs, studyDate) {
    const id = crypto.randomUUID();
    if (saveSessions((current) => logStudyTime(current, id, durationMs, Date.now(), studyDate))) {
      setShowAddTime(false);
      if (studyDate !== date) onSelectDate(studyDate);
    }
  }

  const elapsed = active ? Math.max(0, now - active.startedAt) : 0;

  return (
    <section aria-labelledby="study-timer-title" className="panel px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-3">
          <Timer size={20} className="shrink-0 text-accent" aria-hidden="true" />
          <div>
            <h3 id="study-timer-title" className="section-heading">{isToday ? 'Study timer' : 'Study time'}</h3>
            <p className="mt-0.5 text-xs text-muted">
              {isToday ? (active ? 'Session running' : 'Ready to study') : dateLabel}
            </p>
          </div>
        </div>
        {isToday && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span role="timer" aria-label="Current session" className="text-xl font-semibold tabular-nums text-ink">
              {durationParts(elapsed).map((part) => String(part).padStart(2, '0')).join(':')}
            </span>
            <button type="button" className="button-primary" onClick={active ? stop : start}>
              {active ? <Square size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
              {active ? 'Stop' : 'Start'}
            </button>
          </div>
        )}
        <div>
          <p className="text-xs text-muted">{isToday ? 'Studied today' : 'Time studied'}</p>
          <p className="mt-0.5 font-semibold tabular-nums text-ink">{durationLabel(studied)}</p>
        </div>
        <button type="button" className="button-secondary" aria-expanded={showHistory}
          aria-controls="study-session-history" onClick={() => setShowHistory(!showHistory)}>
          {isToday ? 'Today’s history' : 'History'} <span className="tabular-nums text-muted">{history.length}</span>
          <ChevronDown size={14} aria-hidden="true" className={showHistory ? 'rotate-180' : ''} />
        </button>
      </div>
      <div id="study-session-history" hidden={!showHistory} className="mt-4 border-t border-line pt-2">
        <div className="flex justify-end pb-1">
          <button type="button" className="button-secondary" onClick={() => setShowAddTime(true)}>
            <Plus size={14} aria-hidden="true" /> Add time
          </button>
        </div>
        {history.length ? (
          <ul aria-label={`Study sessions for ${dateLabel}`} className="max-h-60 divide-y divide-line overflow-y-auto">
            {history.map(({ session, start, end, duration }) => (
              <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-muted">
                  {session.durationMs ? 'Manual entry' : sessionDate.formatRange(start, end)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums text-ink">
                    {durationLabel(duration)}
                  </span>
                  <button type="button" className="icon-button hover:text-danger"
                    aria-label={`Delete study session from ${dateLabel}`}
                    title="Delete study session" onClick={() => setPendingDeletion(session)}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="py-3 text-sm text-muted">{isToday ? 'No study sessions today.' : 'No study sessions for this date.'}</p>}
      </div>
      {isActive && showAddTime && (
        <AddStudyTimeDialog date={date} today={today} onCancel={() => setShowAddTime(false)} onSave={addTime} />
      )}
      {isActive && pendingDeletion && (
        <DeleteSessionDialog session={pendingDeletion}
          onCancel={() => setPendingDeletion(null)} onConfirm={() => remove(pendingDeletion)} />
      )}
    </section>
  );
}
