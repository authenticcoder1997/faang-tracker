import { useCloudStorage } from '../hooks/useCloudStorage';
import { lldTopics } from '../data/lldTopics';
import { hldTopics } from '../data/hldTopics';
import { striverDsaTopics } from '../lib/dsaPlan';
import { buildHomeworkSchedule, homeworkPoints, HOMEWORK_TARGET } from '../lib/homeworkSchedule';
import { dateKey } from '../lib/tasks';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ExternalLink,
  Layers,
  Monitor,
} from 'lucide-react';
import { EmptyState, PageHeader, StatsStrip } from './ui/Workspace';

const shortDate = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' });
const agendaDate = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'short' });
const atNoon = (date) => new Date(date + 'T12:00:00');
const pointsLabel = (points) => `${points} ${points === 1 ? 'pt' : 'pts'}`;

const DESIGN_TRACKS = {
  lld: {
    id: 'lld', label: 'LLD', title: 'Low-level design', icon: Layers,
    subtitle: 'Design patterns and practice · AlgoMaster', source: 'AlgoMaster',
  },
  hld: {
    id: 'hld', label: 'HLD', title: 'System design', icon: Monitor,
    subtitle: 'System breakdown · Hello Interview', source: 'Hello Interview',
  },
};

function AgendaSection({ track, onOpen }) {
  const Icon = track.icon;
  const points = track.items.reduce((sum, item) => sum + homeworkPoints(track.id, item), 0);

  return (
    <section
      className="panel min-w-0 overflow-hidden"
      aria-labelledby={`agenda-${track.id}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2.5">
            <Icon size={17} className="shrink-0 text-accent" />
            <h3 id={`agenda-${track.id}`} className="section-heading">
              {track.title}
            </h3>
            <span className="status-pill tabular-nums">
              {pointsLabel(points)}
            </span>
          </div>
          <p className="max-w-lg text-xs leading-5 text-muted">
            {track.subtitle}
          </p>
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

      <ul className="divide-y divide-line">
        {track.items.map((item, index) => (
          <li
            key={item.id}
            className="flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-hover sm:px-6"
          >
            <button
              type="button"
              onClick={() => track.complete(item.id)}
              aria-label={`Mark complete: ${item.title}`}
              title="Mark complete"
              className="completion-button mt-0.5 shrink-0"
            >
              <Circle size={21} aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words text-sm font-semibold leading-6 text-ink transition-colors hover:text-accent"
              >
                {item.title}
              </a>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
                {track.id === 'dsa' ? (
                  <span className="tabular-nums">Question {index + 1}</span>
                ) : (
                  <span>{item.topic || item.section || 'Breakdown'}</span>
                )}
                {item.difficulty && (
                  <span className="status-pill">{item.difficulty}</span>
                )}
                <span className="status-pill text-accent">
                  {pointsLabel(homeworkPoints(track.id, item))}
                </span>
                {item.premium && (
                  <span className="status-pill text-warning">Premium</span>
                )}
              </div>
              {item.description && (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                  {item.description}
                </p>
              )}
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${item.title} on ${track.source}`}
              title={`Open on ${track.source}`}
              className="icon-button -mr-1 shrink-0"
            >
              <ExternalLink size={15} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DailyHome({ setActiveTab }) {
  const [dsa, setDsa] = useCloudStorage('dsa', striverDsaTopics);
  const [lld, setLld] = useCloudStorage('lld', lldTopics);
  const [hld, setHld] = useCloudStorage('hld', hldTopics);
  const today = dateKey();
  const schedule = useMemo(() => buildHomeworkSchedule(dsa, lld, hld, today), [dsa, lld, hld, today]);
  const [chosenDate, setChosenDate] = useState(null);
  const chosenIndex = schedule.findIndex((day) => day.date === chosenDate);
  const selectedDayIndex = chosenIndex === -1
    ? schedule.findIndex((day) => day.date >= today)
    : chosenIndex;
  const day = schedule[selectedDayIndex];

  const complete = (setItems, id) => setItems((items) => items.map((item) =>
    item.id === id && !item.completed ? { ...item, completed: true, homeworkDate: day.date } : item,
  ));

  const tracks = [
    day.dsa.length > 0 && {
      id: 'dsa',
      label: 'DSA',
      title: 'DSA practice',
      icon: BookOpen,
      subtitle: [...new Set(day.dsa.map((item) => item.section))].join(' · '),
      items: day.dsa,
      complete: (id) => complete(setDsa, id),
      source: 'TakeUForward',
    },
    day.design && {
      ...DESIGN_TRACKS[day.design.track],
      items: [day.design.item],
      complete: (id) => complete(day.design.track === 'lld' ? setLld : setHld, id),
    },
  ].filter(Boolean);
  const remainingPoints = tracks.reduce((sum, track) =>
    sum + track.items.reduce((points, item) => points + homeworkPoints(track.id, item), 0), 0);
  const progress = Math.min(100, Math.round(day.earned / HOMEWORK_TARGET * 100));

  return (
    <div className="page-frame">
      <PageHeader
        eyebrow="Study plan"
        title="Homework"
        description="Unfinished Striver DSA practice and one design exercise per day."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setChosenDate(null)}
              className="button-secondary"
            >
              Today
            </button>
            <div className="flex min-w-0 items-center gap-1 rounded-xl border border-line bg-surface p-1">
              <button
                type="button"
                onClick={() => setChosenDate(schedule[selectedDayIndex - 1].date)}
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
                value={day.date}
                onChange={(event) => setChosenDate(event.target.value)}
                className="min-w-24 cursor-pointer appearance-none bg-transparent px-1 py-2 text-center text-sm font-medium text-ink outline-none focus-visible:outline-2 focus-visible:outline-accent"
                style={{ textAlignLast: 'center' }}
              >
                {schedule.map(({ date }) => (
                  <option key={date} value={date}>
                    {shortDate.format(atNoon(date))}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setChosenDate(schedule[selectedDayIndex + 1].date)}
                disabled={selectedDayIndex >= schedule.length - 1}
                aria-label="Next study day"
                className="icon-button disabled:cursor-default disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        }
      />

      <StatsStrip
        items={[
          {
            label: 'Daily target',
            value: `${HOMEWORK_TARGET} pts`,
            detail: 'DSA plus one design exercise',
          },
          {
            label: 'DSA scoring',
            value: '1 / 3 / 5 pts',
            detail: 'Easy / Medium / Hard',
          },
          {
            label: 'Design scoring',
            value: '5 pts',
            detail: 'Each LLD or HLD exercise',
          },
        ]}
      />

      <div className="mb-5 mt-9 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="eyebrow mb-2">Daily agenda</p>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
            <CalendarDays size={17} className="text-accent" />
            {agendaDate.format(atNoon(day.date))}
          </h2>
        </div>
        <div className="w-full sm:w-60" aria-label="Selected day progress">
          <div className="mb-2 flex items-center justify-between gap-4 text-xs">
            <span className="text-muted">
              {day.earned} / {HOMEWORK_TARGET} pts earned
            </span>
            <span className="font-medium tabular-nums text-accent">{remainingPoints} pts left</span>
          </div>
          <div className="progress-track" role="progressbar" aria-label="Daily points"
            aria-valuenow={Math.min(HOMEWORK_TARGET, day.earned)} aria-valuemin={0} aria-valuemax={HOMEWORK_TARGET}>
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {tracks.length ? (
        <div className={`grid items-start gap-5 ${tracks.length > 1 ? 'xl:grid-cols-2' : ''}`}>
          {tracks.map((track) => (
            <AgendaSection key={track.id} track={track} onOpen={setActiveTab} />
          ))}
        </div>
      ) : (
        <EmptyState icon={CheckCircle2}
          title={day.earned >= HOMEWORK_TARGET ? 'Daily target reached' : 'No unfinished work for this day'} />
      )}
    </div>
  );
}
