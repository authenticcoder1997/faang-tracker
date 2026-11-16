import { useHomeworkSchedule } from '../hooks/useHomeworkSchedule';
import { useWorkspace, useWorkspaceValue } from '../hooks/useWorkspace';
import { deferHomeworkQuestion, extraHomeworkPlan, homeworkPlanFor } from '../lib/homeworkSchedule';
import { completedQuestionsByDate } from '../lib/studyProgress';
import { deferRevision } from '../lib/studyRevisions';
import { studySessionDate } from '../lib/studySessions';
import { addDays, dateKey } from '../lib/tasks';
import { dsaCatalog } from '../lib/dsaCatalog';
import { allDsaTopics } from '../lib/dsaPlan';
import { lldTopics } from '../data/lldTopics';
import { hldTopics } from '../data/hldTopics';
import { useEffect, useMemo, useRef, useState } from 'react';
import CompletedQuestions from './CompletedQuestions';
import QuestionCompletionDialog from './QuestionCompletionDialog';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClockArrowUp,
  Layers,
  Monitor,
} from 'lucide-react';

const shortDate = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' });
const agendaDate = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'short' });
const atNoon = (date) => new Date(date + 'T12:00:00');
const completionCatalogs = {
  dsa: [...new Map([...allDsaTopics, ...dsaCatalog].map((item) => [item.id, item])).values()],
  lld: lldTopics,
  hld: hldTopics,
};

const TRACKS = {
  dsa: { id: 'dsa', label: 'DSA', title: 'DSA questions', icon: BookOpen, source: 'tuf' },
  lld: { id: 'lld', label: 'LLD', title: 'LLD', icon: Layers, source: 'lld' },
  hld: { id: 'hld', label: 'HLD', title: 'HLD', icon: Monitor, source: 'hld' },
};

function SkipQuestionDialog({ question, from, onSkip, onClose }) {
  const dialog = useRef(null);
  const [days, setDays] = useState('1');
  const count = Number(days);
  const until = Number.isInteger(count) && count >= 1 && count <= 365 ? addDays(from, count) : null;
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog ref={dialog} aria-labelledby="skip-question-title" onCancel={onClose}
      className="task-dialog m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line p-5">
      <h2 id="skip-question-title" className="text-lg font-semibold">Skip question</h2>
      <p className="mt-1 break-words text-sm text-muted">{question.title}</p>
      <form className="mt-4 space-y-3" onSubmit={(event) => {
        event.preventDefault();
        if (until) onSkip(until);
      }}>
        <label className="block text-sm text-muted">
          Number of days
          <input type="number" min="1" max="365" step="1" inputMode="numeric" required
            className="input-control mt-1 !text-base" value={days} onChange={(event) => setDays(event.target.value)} />
        </label>
        <p className="min-h-5 text-sm text-muted" aria-live="polite">
          {until && <>Back in Homework on <time dateTime={until}>{agendaDate.format(atNoon(until))}</time></>}
        </p>
        <p className="text-sm text-muted">Also adds the question to your Revision list.</p>
        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button-primary" disabled={!until}>Skip</button>
        </div>
      </form>
    </dialog>
  );
}

function AgendaSection({ track, onOpen, onComplete, onSkip, emptyMessage, emptyAction }) {
  const Icon = track.icon;
  const assignmentCount = track.items.length;
  const unit = track.id === 'dsa' ? 'question' : 'exercise';

  return (
    <section
      className="min-w-0"
      aria-labelledby={`agenda-${track.id}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pt-4 pb-1 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <Icon size={17} className="shrink-0 text-accent" />
            <h3 id={`agenda-${track.id}`} className="section-heading">
              {track.title}
            </h3>
            {assignmentCount > 0 && (
              <span className="status-pill tabular-nums">
                {assignmentCount} {unit}{assignmentCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpen(track.id)}
          className="inline-flex shrink-0 items-center gap-1.5 py-0.5 text-xs font-medium text-accent hover:opacity-75"
          aria-label={`View all ${track.label}`}
        >
          View track <ArrowRight size={13} />
        </button>
      </header>

      {track.items.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-2 pb-4 sm:px-6">
          <p className="text-sm text-muted">{emptyMessage}</p>
          {emptyAction}
        </div>
      )}
      <ul className="divide-y divide-line">
        {track.items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-hover sm:gap-4 sm:px-6"
          >
            <button
              type="button"
              onClick={() => onComplete({ track: track.id, item })}
              aria-label={`Mark complete: ${item.title}`}
              aria-haspopup="dialog"
              title="Mark complete"
              className="completion-button shrink-0"
            >
              <Circle size={21} aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-words text-sm font-semibold leading-6 text-ink transition-colors hover:text-accent"
                >
                  {item.title}
                </a>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  {item.difficulty && (
                    <span className="status-pill">{item.difficulty}</span>
                  )}
                  {(item.topic || item.section) && (
                    <span className="status-pill">{item.topic || item.section}</span>
                  )}
                  {item.premium && (
                    <span className="status-pill text-warning">Premium</span>
                  )}
                </div>
              </div>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                  {item.description}
                </p>
              )}
            </div>
            <button type="button" className="icon-button" aria-label={`Skip ${item.title}`} title="Skip question"
              aria-haspopup="dialog" onClick={() => onSkip({ item, source: track.source })}>
              <ClockArrowUp size={15} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function HomeworkAgenda({ date, today, sessions, onSelectDate, setActiveTab }) {
  const { updateData } = useWorkspace();
  const { schedule, plan, skips, dsa } = useHomeworkSchedule(today);
  const [skipQuestion, setSkipQuestion] = useState(null);
  const [completion, setCompletion] = useState(null);
  const progress = useWorkspaceValue((state) => state.data.progress);
  const completions = useMemo(() => completedQuestionsByDate(progress, completionCatalogs), [progress]);
  const studyDates = useMemo(() => [...new Set([
    today, date, ...schedule.map(({ date }) => date), ...completions.keys(),
    ...sessions.flatMap((session) => {
      const { startedAt, stoppedAt, durationMs } = session;
      if (stoppedAt === null) return [];
      const firstDay = studySessionDate(session);
      return durationMs !== undefined || stoppedAt === startedAt ? [firstDay]
        : [firstDay, dateKey(new Date(stoppedAt - 1))];
    }),
  ])].sort(), [schedule, completions, sessions, today, date]);
  const todaysAgenda = schedule.find((day) => day.date >= today);
  useEffect(() => {
    if (todaysAgenda.date !== today) return;
    const next = homeworkPlanFor(todaysAgenda, plan, skips);
    if (next === plan) return;
    updateData((current) => current.homework === plan && current.homeworkSkips === skips
      ? { ...current, homework: next }
      : current);
  }, [plan, skips, today, todaysAgenda, updateData]);

  const selectedDayIndex = studyDates.indexOf(date);
  const day = schedule.find((day) => day.date === date);

  function postpone(until) {
    const { item: { id }, source } = skipQuestion;
    if (updateData((current) => ({
      ...current,
      homeworkSkips: deferHomeworkQuestion(current.homeworkSkips, id, until),
      revisions: deferRevision(current.revisions, id, source, until),
    }))) setSkipQuestion(null);
  }

  const dsaTrack = { ...TRACKS.dsa, items: day?.dsa ?? [] };
  const designTracks = ['lld', 'hld'].map((track) => ({
    ...TRACKS[track], items: (day?.designs ?? []).filter((design) => design.track === track).map(({ item }) => item),
  })).filter(({ items }) => items.length);
  const extraPlan = date === today && plan?.date === today && !dsaTrack.items.length && !designTracks.length
    ? extraHomeworkPlan(plan, dsa, skips)
    : null;

  return (
    <section aria-labelledby="homework-title" className="grid min-w-0 gap-4">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="homework-title" className="text-lg font-semibold tracking-tight">Homework</h2>
          <time dateTime={date} className="inline-flex items-center gap-1.5 text-sm text-muted">
            <CalendarDays size={14} className="shrink-0 text-accent" aria-hidden="true" />
            {agendaDate.format(atNoon(date))}
          </time>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectDate(today)}
            className="button-secondary"
          >
            Today
          </button>
          <div className="flex min-w-0 items-center gap-1 rounded-xl border border-line bg-surface p-1">
            <button
              type="button"
              onClick={() => onSelectDate(studyDates[selectedDayIndex - 1])}
              disabled={selectedDayIndex <= 0}
              aria-label="Previous study day"
              className="icon-button disabled:cursor-default disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <label htmlFor="date-selector" className="sr-only">
              Study date
            </label>
            <select
              id="date-selector"
              value={date}
              onChange={(event) => onSelectDate(event.target.value)}
              className="min-w-24 cursor-pointer appearance-none bg-transparent px-1 py-2 text-center text-sm font-medium text-ink outline-none focus-visible:outline-2 focus-visible:outline-accent"
              style={{ textAlignLast: 'center' }}
            >
              {studyDates.map((studyDate) => (
                <option key={studyDate} value={studyDate}>
                  {shortDate.format(atNoon(studyDate))}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onSelectDate(studyDates[selectedDayIndex + 1])}
              disabled={selectedDayIndex >= studyDates.length - 1}
              aria-label="Next study day"
              className="icon-button disabled:cursor-default disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="panel min-w-0 overflow-hidden">
        <AgendaSection track={dsaTrack} onOpen={setActiveTab} onComplete={setCompletion} onSkip={setSkipQuestion}
          emptyMessage={extraPlan ? 'Today’s homework is complete.' : 'No DSA questions for this day.'}
          emptyAction={extraPlan && (
            <button type="button" className="button-secondary"
              onClick={() => updateData((current) => current.homework === plan && current.homeworkSkips === skips
                ? { ...current, homework: extraPlan }
                : current)}>
              Get more work
            </button>
          )} />
      </div>
      <div className="panel min-w-0 divide-y divide-line overflow-hidden">
        {designTracks.length > 0 ? (
          designTracks.map((track) => (
            <AgendaSection key={track.id} track={track} onOpen={setActiveTab} onComplete={setCompletion}
              onSkip={setSkipQuestion} />
          ))
        ) : (
          <section aria-labelledby="agenda-design" className="px-4 py-4 sm:px-6">
            <h3 id="agenda-design" className="section-heading flex items-center gap-2.5">
              <Layers size={17} className="shrink-0 text-accent" aria-hidden="true" /> LLD / HLD
            </h3>
            <p className="mt-2 text-sm text-muted">No design exercises for this day.</p>
          </section>
        )}
      </div>
      <CompletedQuestions date={date} today={today} questions={completions.get(date)} />
      {completion && <QuestionCompletionDialog track={completion.track} item={completion.item} homeworkDate={date}
        source={TRACKS[completion.track].source} onClose={() => setCompletion(null)} />}
      {skipQuestion && <SkipQuestionDialog question={skipQuestion.item} from={date < today ? today : date}
        onSkip={postpone} onClose={() => setSkipQuestion(null)} />}
    </section>
  );
}
