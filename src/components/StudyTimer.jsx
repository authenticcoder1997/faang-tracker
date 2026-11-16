import { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Play, Plus, Square, Timer, Trash2, X } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import {
  activeStudySession, deleteStudySession, saveStudyRange, startStudySession, stopStudySession,
  studySessionDate, studySessionsByDate,
} from '../lib/studySessions';
import { addDays, dateKey, isValidDate } from '../lib/tasks';

const sessionDate = new Intl.DateTimeFormat('en', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

const studyDay = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' });
const shortDay = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
const clockTime = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' });

function timeInputValue(timestamp) {
  const time = new Date(timestamp);
  return [time.getHours(), time.getMinutes()].map((part) => String(part).padStart(2, '0')).join(':');
}

function StudyTimeRange({ start, end }) {
  const startTime = new Date(start);
  const endTime = new Date(end);
  return (
    <span className="flex flex-wrap gap-x-2 text-muted">
      <span>From <time className="font-medium text-ink" dateTime={startTime.toISOString()}>{clockTime.format(startTime)}</time></span>
      <span>To <time className="font-medium text-ink" dateTime={endTime.toISOString()}>
        {clockTime.format(endTime)}{dateKey(startTime) !== dateKey(endTime) && ` (${shortDay.format(endTime)})`}
      </time></span>
    </span>
  );
}

function durationParts(ms) {
  const seconds = Math.floor(ms / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60];
}

function durationLabel(ms) {
  if (ms > 0 && ms < 60_000) return '<1 min';
  const [hours, minutes] = durationParts(ms);
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function StudyTimeDialog({ date, today, entry, onCancel, onSave }) {
  const dialog = useRef(null);
  const [error, setError] = useState('');
  const hasRange = !!entry && entry.durationMs === undefined;
  const from = hasRange ? timeInputValue(entry.startedAt) : '';
  const to = hasRange ? timeInputValue(entry.stoppedAt) : '';
  const title = entry ? 'Edit study time' : 'Add study time';
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const studyDate = fields.get('date');
    if (!isValidDate(studyDate) || studyDate > dateKey()) {
      setError('Choose today or an earlier date.');
      return;
    }
    const start = fields.get('from');
    const end = fields.get('to');
    // Keep the original precise timestamps if the displayed times are unchanged.
    if (hasRange && studyDate === studySessionDate(entry) && start === from && end === to) {
      onSave({ startedAt: entry.startedAt, stoppedAt: entry.stoppedAt, studyDate });
      return;
    }
    const startedAt = new Date(`${studyDate}T${start}`).getTime();
    const endDate = end < start ? addDays(studyDate, 1) : studyDate;
    const stoppedAt = new Date(`${endDate}T${end}`).getTime();
    if (!(stoppedAt > startedAt && stoppedAt <= Date.now() && stoppedAt - startedAt <= 86_400_000)) {
      setError('Choose a completed time range of up to 24 hours.');
      return;
    }
    onSave({ startedAt, stoppedAt, studyDate });
  }

  return (
    <dialog ref={dialog} aria-labelledby="study-time-dialog-title" onCancel={onCancel}
      className="task-dialog m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line p-5 sm:p-6">
      <h2 id="study-time-dialog-title" className="text-lg font-semibold">{title}</h2>
      <form onSubmit={submit} onChange={() => setError('')} className="mt-3">
        <label className="block text-xs font-medium text-muted">
          Date studied
          <input type="date" name="date" defaultValue={entry ? studySessionDate(entry) : date}
            max={today} required className="input-control mt-1" />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="min-w-0 text-xs font-medium text-muted">
            From
            <input type="time" name="from" defaultValue={from} required className="input-control mt-1" />
          </label>
          <label className="min-w-0 text-xs font-medium text-muted">
            To
            <input type="time" name="to" defaultValue={to} required className="input-control mt-1" />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">An earlier end time means the session ended the next day.</p>
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
  const historyDialog = useRef(null);
  const [now, setNow] = useState(Date.now);
  const [timeEditor, setTimeEditor] = useState(null);
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
    saveSessions((current) => stopStudySession(current, active.id, stoppedAt));
  }

  function remove(session) {
    if (saveSessions((current) => deleteStudySession(current, session.id))) setPendingDeletion(null);
  }

  function saveTime({ startedAt, stoppedAt, studyDate }) {
    const { entry } = timeEditor;
    const id = entry?.id ?? crypto.randomUUID();
    if (saveSessions((current) => saveStudyRange(current, id, startedAt, stoppedAt, !!entry))) {
      setTimeEditor(null);
      if (studyDate !== date) onSelectDate(studyDate);
    }
  }

  const elapsed = active ? Math.max(0, now - active.startedAt) : 0;

  return (
    <section aria-labelledby="study-timer-title" className="border-b border-line px-4 py-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2">
        <h3 id="study-timer-title" className="section-heading flex items-center gap-2">
          <Timer size={17} className="shrink-0 text-accent" aria-hidden="true" /> Study time
        </h3>
        <span className="text-xs text-muted">{isToday ? 'Today' : dateLabel}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-lg font-semibold tabular-nums">{durationLabel(studied)}</p>
          <p className="text-xs text-muted">Studied</p>
        </div>
        {isToday && (
          <button type="button" className="button-primary" onClick={active ? stop : start}>
            {active ? <Square size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            {active ? 'Stop' : 'Start'}
            {active && (
              <span role="timer" aria-label="Current session" className="tabular-nums">
                {durationParts(elapsed).map((part) => String(part).padStart(2, '0')).join(':')}
              </span>
            )}
          </button>
        )}
      </div>
      <div className="mt-2">
        <button type="button" className="button-secondary" aria-haspopup="dialog"
          onClick={() => historyDialog.current.showModal()}>
          History <span className="tabular-nums text-muted">{history.length}</span>
        </button>
      </div>
      <dialog ref={historyDialog} aria-labelledby="study-history-title"
        className="task-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
          <div>
            <h2 id="study-history-title" className="text-lg font-semibold">Study history</h2>
            <p className="text-xs text-muted">{dateLabel}</p>
          </div>
          <button type="button" aria-label="Close study history" className="icon-button"
            onClick={() => historyDialog.current.close()}>
            <X size={17} aria-hidden="true" />
          </button>
        </div>
        {history.length ? (
          <ul aria-label={`Study sessions for ${dateLabel}`} className="max-h-60 divide-y divide-line overflow-y-auto">
            {history.map(({ session, start, end, duration }) => (
              <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                {session.durationMs === undefined ? <StudyTimeRange start={start} end={end} />
                  : <span className="text-muted">Manual entry</span>}
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums text-ink">
                    {durationLabel(duration)}
                  </span>
                  <button type="button" className="icon-button hover:text-accent"
                    aria-label={`Edit study session from ${dateLabel}`}
                    title="Edit study session" onClick={() => setTimeEditor({ entry: session })}>
                    <Pencil size={15} aria-hidden="true" />
                  </button>
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
        <div className="flex justify-end border-t border-line pt-3">
          <button type="button" className="button-secondary" aria-haspopup="dialog" onClick={() => setTimeEditor({})}>
            <Plus size={14} aria-hidden="true" /> Add time
          </button>
        </div>
      </dialog>
      {isActive && timeEditor && (
        <StudyTimeDialog date={date} today={today} entry={timeEditor.entry}
          onCancel={() => setTimeEditor(null)} onSave={saveTime} />
      )}
      {isActive && pendingDeletion && (
        <DeleteSessionDialog session={pendingDeletion}
          onCancel={() => setPendingDeletion(null)} onConfirm={() => remove(pendingDeletion)} />
      )}
    </section>
  );
}
