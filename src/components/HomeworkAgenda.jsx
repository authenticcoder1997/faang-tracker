import { useHomeworkSchedule } from '../hooks/useHomeworkSchedule';
import { useStudyRevisions } from '../hooks/useStudyRevisions';
import { useWorkspace, useWorkspaceValue } from '../hooks/useWorkspace';
import { deferHomeworkQuestion, extraHomeworkPlan, homeworkPlanFor } from '../lib/homeworkSchedule';
import { completedQuestionsByDate, mergeChangedStudyProgress } from '../lib/studyProgress';
import { revisionQuestion } from '../lib/revisionQuestions';
import { deferRevision, markRevisionReviewed, revisionTrack } from '../lib/studyRevisions';
import { studySessionDate } from '../lib/studySessions';
import { addDays, dateKey, dueDateLabel } from '../lib/tasks';
import { dsaCatalog } from '../lib/dsaCatalog';
import { allDsaTopics } from '../lib/dsaPlan';
import { lldTopics } from '../data/lldTopics';
import { hldTopics } from '../data/hldTopics';
import { useEffect, useMemo, useRef, useState } from 'react';
import CompletedQuestions from './CompletedQuestions';
import {
  ArrowRight,
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClockArrowUp,
  Layers,
  Monitor,
  RotateCcw,
} from 'lucide-react';

const shortDate = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' });
const agendaDate = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'short' });
const atNoon = (date) => new Date(date + 'T12:00:00');
const dsaById = new Map([...allDsaTopics, ...dsaCatalog].map((item) => [item.id, item]));
const completionCatalogs = {
  dsa: [...dsaById.values()],
  lld: lldTopics,
  hld: hldTopics,
};

const TRACKS = {
  dsa: { id: 'dsa', label: 'DSA', title: 'DSA questions', icon: BookOpen },
  lld: { id: 'lld', label: 'LLD', title: 'LLD', icon: Layers },
  hld: { id: 'hld', label: 'HLD', title: 'HLD', icon: Monitor },
};

function RevisionButton({ item, revision, today, onAdd, onReview }) {
  const reviewedToday = revision?.reviewedOn === today;
  const action = reviewedToday ? 'Reviewed today' : revision ? 'Mark reviewed' : 'Add to revision';
  const Icon = reviewedToday ? BookmarkCheck : revision ? RotateCcw : BookmarkPlus;
  return (
    <button type="button" className={`icon-button -mr-1 shrink-0${revision ? ' !text-accent' : ''}`}
      aria-label={`${action}: ${item.title}`} disabled={reviewedToday}
      title={revision ? `${action} · ${dueDateLabel(revision.dueDate, today)}` : action}
      onClick={revision ? onReview : onAdd}>
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}

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
        <div className="flex justify-end gap-2 border-t border-line pt-3">
          <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button-primary" disabled={!until}>Skip</button>
        </div>
      </form>
    </dialog>
  );
}

function AgendaSection({ track, today, onOpen, onComplete, onSkip, renderRevision, emptyMessage, emptyAction }) {
  const Icon = track.icon;
  const { assignmentCount, revisionCount } = track;
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
            {revisionCount > 0 && (
              <span className="status-pill tabular-nums">
                {revisionCount} {revisionCount === 1 ? 'revision' : 'revisions'}
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
        {track.items.map(({ question, assignment, revision }) => {
          const item = assignment || question;
          const action = assignment ? 'Mark complete' : 'Mark reviewed';
          const url = question?.url || item.url;
          const id = assignment?.id || revision.id;
          return (
            <li
              key={id}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-hover sm:gap-4 sm:px-6"
            >
              <button
                type="button"
                onClick={() => onComplete(track.id, assignment, revision)}
                aria-label={`${action}: ${item.title}`}
                title={action}
                className="completion-button shrink-0"
              >
                <Circle size={21} aria-hidden="true" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-words text-sm font-semibold leading-6 text-ink transition-colors hover:text-accent"
                  >
                    {item.title}
                  </a>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    {revision && (
                      <>
                        <span className="status-pill border-accent/30 bg-accent-soft font-semibold text-accent">Revision</span>
                        <time dateTime={revision.dueDate}
                          title={shortDate.format(atNoon(revision.dueDate))}
                          className={revision.dueDate < today ? 'text-warning' : ''}>
                          {dueDateLabel(revision.dueDate, today)}
                        </time>
                      </>
                    )}
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
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" className="icon-button" aria-label={`Skip ${item.title}`} title="Skip question"
                  aria-haspopup="dialog" onClick={() => onSkip({ id, title: item.title })}>
                  <ClockArrowUp size={15} aria-hidden="true" />
                </button>
                {renderRevision(track.id, assignment || { ...question, id })}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function HomeworkAgenda({ date, today, sessions, onSelectDate, setActiveTab }) {
  const { updateData } = useWorkspace();
  const { schedule, plan, skips, dsa } = useHomeworkSchedule(today);
  const { revisions, addRevision, markReviewed } = useStudyRevisions();
  const revisionsById = useMemo(() => new Map(revisions.map((record) => [record.id, record])), [revisions]);
  const skipDates = useMemo(() => new Map(skips.map(({ id, until }) => [id, until])), [skips]);
  const [skipQuestion, setSkipQuestion] = useState(null);
  const progress = useWorkspaceValue((state) => state.data.progress);
  const completions = useMemo(() => completedQuestionsByDate(progress, completionCatalogs), [progress]);
  const studyDates = useMemo(() => [...new Set([
    today, date, ...schedule.map(({ date }) => date), ...completions.keys(),
    ...revisions.flatMap(({ id, dueDate }) => {
      const until = skipDates.get(id);
      return until > today && dueDate <= until ? [until] : [];
    }),
    ...sessions.flatMap((session) => {
      const { startedAt, stoppedAt, durationMs } = session;
      if (stoppedAt === null) return [];
      const firstDay = studySessionDate(session);
      return durationMs !== undefined || stoppedAt === startedAt ? [firstDay]
        : [firstDay, dateKey(new Date(stoppedAt - 1))];
    }),
  ])].sort(), [schedule, completions, sessions, today, date, revisions, skipDates]);
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
    const id = skipQuestion.id;
    if (updateData((current) => ({
      ...current,
      homeworkSkips: deferHomeworkQuestion(current.homeworkSkips, id, until),
      revisions: deferRevision(current.revisions, id, until),
    }))) setSkipQuestion(null);
  }

  function renderRevision(track, item) {
    const revision = revisionsById.get(item.id);
    function add() {
      const sources = dsaById.get(item.id)?.sources ?? {};
      const source = track === 'dsa'
        ? Object.keys(sources).find((key) => sources[key].url === item.url) ?? 'tuf'
        : track;
      addRevision(item.id, source);
    }
    return <RevisionButton item={item} revision={revision} today={today} onAdd={add} onReview={() => markReviewed(item.id)} />;
  }

  function complete(track, assignment, revision) {
    const completedOn = dateKey();
    updateData((current) => {
      const next = {
        ...current,
        revisions: revision ? markRevisionReviewed(current.revisions, revision.id, completedOn) : current.revisions,
      };
      if (!assignment) return next;
      const previous = { ...assignment, ...current.progress[track][assignment.id] };
      if (previous.completed) return next;
      const finished = { ...previous, completed: true, homeworkDate: date };
      const progress = mergeChangedStudyProgress(current.progress[track], [previous], [finished], completedOn);
      return { ...next, progress: { ...current.progress, [track]: progress } };
    });
  }

  const revisionsByTrack = { dsa: [], lld: [], hld: [] };
  const due = revisions.filter((record) => {
    const until = skipDates.get(record.id) ?? '';
    return record.dueDate <= date && (date === today ? until <= today : date > today && until === date);
  }).sort((first, second) => first.dueDate.localeCompare(second.dueDate));
  for (const record of due) {
    const question = revisionQuestion(record);
    if (question) revisionsByTrack[revisionTrack(record)].push({ question, revision: record });
  }
  const tracks = Object.values(TRACKS).flatMap((track) => {
    const { id } = track;
    const assignments = id === 'dsa' ? day?.dsa ?? []
      : (day?.designs ?? []).filter((design) => design.track === id).map(({ item }) => item);
    const reviews = revisionsByTrack[id];
    if (!assignments.length && !reviews.length) return [];
    const reviewsById = new Map(reviews.map((review) => [review.revision.id, review]));
    const rows = assignments.map((assignment) => {
      const review = reviewsById.get(assignment.id);
      reviewsById.delete(assignment.id);
      return { ...review, assignment };
    });
    return [{
      ...track,
      items: [...rows, ...reviewsById.values()],
      assignmentCount: assignments.length,
      revisionCount: reviews.length,
    }];
  });
  const extraPlan = date === today && plan?.date === today && !tracks.length
    ? extraHomeworkPlan(plan, dsa, skips)
    : null;
  const dsaTrack = tracks.find(({ id }) => id === 'dsa') ?? {
    ...TRACKS.dsa, items: [], assignmentCount: 0, revisionCount: 0,
  };
  const designTracks = tracks.filter(({ id }) => id !== 'dsa');

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
        <AgendaSection track={dsaTrack} today={today} onOpen={setActiveTab} onComplete={complete}
          onSkip={setSkipQuestion} renderRevision={renderRevision}
          emptyMessage={extraPlan ? 'Today’s homework is complete.' : 'No DSA questions for this day.'}
          emptyAction={extraPlan && (
            <button type="button" className="button-secondary"
              onClick={() => updateData((current) => current.homework === plan && current.homeworkSkips === skips &&
                !current.revisions.some((record) => record.dueDate <= today &&
                  (skipDates.get(record.id) ?? '') <= today && revisionQuestion(record))
                ? { ...current, homework: extraPlan }
                : current)}>
              Get more work
            </button>
          )} />
      </div>
      <div className="panel min-w-0 divide-y divide-line overflow-hidden">
        {designTracks.length > 0 ? (
          designTracks.map((track) => (
            <AgendaSection key={track.id} track={track} today={today} onOpen={setActiveTab} onComplete={complete}
              onSkip={setSkipQuestion} renderRevision={renderRevision} />
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
      <CompletedQuestions date={date} today={today} questions={completions.get(date)} renderRevision={renderRevision} />
      {skipQuestion && <SkipQuestionDialog question={skipQuestion} from={date < today ? today : date}
        onSkip={postpone} onClose={() => setSkipQuestion(null)} />}
    </section>
  );
}
