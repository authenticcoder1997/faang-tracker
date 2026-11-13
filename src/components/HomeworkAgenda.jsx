import { useHomeworkSchedule } from '../hooks/useHomeworkSchedule';
import { useWorkspace, useWorkspaceValue } from '../hooks/useWorkspace';
import { extraHomeworkPlan, homeworkPlanFor } from '../lib/homeworkSchedule';
import { completedQuestionsByDate, mergeChangedStudyProgress } from '../lib/studyProgress';
import { revisionQuestion } from '../lib/revisionQuestions';
import { markRevisionReviewed, revisionTrack } from '../lib/studyRevisions';
import { studySessionDate } from '../lib/studySessions';
import { dateKey, dueDateLabel } from '../lib/tasks';
import { dsaCatalog } from '../lib/dsaCatalog';
import { allDsaTopics } from '../lib/dsaPlan';
import { lldTopics } from '../data/lldTopics';
import { hldTopics } from '../data/hldTopics';
import { useEffect, useMemo } from 'react';
import CompletedQuestions from './CompletedQuestions';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Circle,
  ExternalLink,
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
  dsa: { id: 'dsa', label: 'DSA', title: 'DSA questions', icon: BookOpen, source: 'TakeUForward' },
  lld: {
    id: 'lld', label: 'LLD', title: 'LLD', icon: Layers,
    source: 'AlgoMaster',
  },
  hld: {
    id: 'hld', label: 'HLD', title: 'HLD', icon: Monitor,
    source: 'Hello Interview',
  },
};

function AgendaSection({ track, today, onOpen, onComplete, emptyMessage, emptyAction }) {
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
          const source = question?.sourceLabel || track.source;
          const url = question?.url || item.url;
          return (
            <li
              key={assignment?.id || revision.id}
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
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${item.title} on ${source}`}
                title={`Open on ${source}`}
                className="icon-button -mr-1 shrink-0"
              >
                <ExternalLink size={15} />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function HomeworkAgenda({ date, today, sessions, onSelectDate, setActiveTab }) {
  const { updateData } = useWorkspace();
  const { schedule, plan, dsa } = useHomeworkSchedule(today);
  const revisions = useWorkspaceValue((state) => state.data.revisions);
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
    if (todaysAgenda.date !== today || plan?.date >= today) return;
    updateData((current) => current.homework === plan
      ? { ...current, homework: homeworkPlanFor(todaysAgenda) }
      : current);
  }, [plan, today, todaysAgenda, updateData]);

  const selectedDayIndex = studyDates.indexOf(date);
  const day = schedule.find((day) => day.date === date);

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
  if (date === today) {
    const due = revisions.filter((record) => record.dueDate <= today)
      .sort((first, second) => first.dueDate.localeCompare(second.dueDate));
    for (const record of due) {
      const question = revisionQuestion(record);
      if (question) revisionsByTrack[revisionTrack(record)].push({ question, revision: record });
    }
  }
  const tracks = Object.values(TRACKS).flatMap((track) => {
    const { id } = track;
    const assignments = id === 'dsa' ? day?.dsa || [] : day?.design?.track === id ? [day.design.item] : [];
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
    ? extraHomeworkPlan(plan, dsa)
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
          emptyMessage={extraPlan ? 'Today’s homework is complete.' : 'No DSA questions for this day.'}
          emptyAction={extraPlan && (
            <button type="button" className="button-secondary"
              onClick={() => updateData((current) => current.homework === plan &&
                !current.revisions.some((record) => record.dueDate <= today && revisionQuestion(record))
                ? { ...current, homework: extraPlan }
                : current)}>
              Get more work
            </button>
          )} />
      </div>
      <div className="panel min-w-0 divide-y divide-line overflow-hidden">
        {designTracks.length > 0 ? (
          designTracks.map((track) => (
            <AgendaSection key={track.id} track={track} today={today} onOpen={setActiveTab} onComplete={complete} />
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
    </section>
  );
}
