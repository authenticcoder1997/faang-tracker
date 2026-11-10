import { useCloudStorage } from '../hooks/useCloudStorage';
import { useWorkspace, useWorkspaceValue } from '../hooks/useWorkspace';
import { lldTopics } from '../data/lldTopics';
import { hldTopics } from '../data/hldTopics';
import { striverDsaTopics } from '../lib/dsaPlan';
import { buildHomeworkSchedule, extraHomeworkPlan, homeworkPlanFor } from '../lib/homeworkSchedule';
import { useEffect, useMemo, useState } from 'react';
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

const shortDate = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' });
const agendaDate = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'short' });
const atNoon = (date) => new Date(date + 'T12:00:00');

const DESIGN_TRACKS = {
  lld: {
    id: 'lld', label: 'LLD', title: 'LLD', icon: Layers,
    subtitle: 'Low-level design · AlgoMaster', source: 'AlgoMaster',
  },
  hld: {
    id: 'hld', label: 'HLD', title: 'HLD', icon: Monitor,
    subtitle: 'System design · Hello Interview', source: 'Hello Interview',
  },
};

function AgendaSection({ track, onOpen }) {
  const Icon = track.icon;
  const count = track.items.length;
  const unit = track.id === 'dsa' ? 'question' : 'exercise';

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
              {count} {unit}{count === 1 ? '' : 's'}
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
        {track.items.map((item) => (
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

export default function HomeworkAgenda({ today, setActiveTab, children }) {
  const { updateData } = useWorkspace();
  const plan = useWorkspaceValue((state) => state.data.homework);
  const [dsa, setDsa] = useCloudStorage('dsa', striverDsaTopics);
  const [lld, setLld] = useCloudStorage('lld', lldTopics);
  const [hld, setHld] = useCloudStorage('hld', hldTopics);
  const schedule = useMemo(() => buildHomeworkSchedule(dsa, lld, hld, today, plan), [dsa, lld, hld, today, plan]);
  const todayIndex = schedule.findIndex((day) => day.date >= today);
  const todaysAgenda = schedule[todayIndex];
  useEffect(() => {
    if (todaysAgenda.date !== today || plan?.date >= today) return;
    updateData((current) => current.homework === plan
      ? { ...current, homework: homeworkPlanFor(todaysAgenda) }
      : current);
  }, [plan, today, todaysAgenda, updateData]);

  const [chosenDate, setChosenDate] = useState(null);
  const chosenIndex = schedule.findIndex((day) => day.date === chosenDate);
  const selectedDayIndex = chosenIndex === -1 ? todayIndex : chosenIndex;
  const day = schedule[selectedDayIndex];

  const complete = (setItems, id) => setItems((items) => items.map((item) =>
    item.id === id && !item.completed ? { ...item, completed: true, homeworkDate: day.date } : item,
  ));

  const dsaTrack = day.dsa.length > 0 && {
    id: 'dsa',
    label: 'DSA',
    title: 'DSA questions',
    icon: BookOpen,
    subtitle: [...new Set(day.dsa.map((item) => item.section))].join(' · '),
    items: day.dsa,
    complete: (id) => complete(setDsa, id),
    source: 'TakeUForward',
  };
  const designTrack = day.design && {
    ...DESIGN_TRACKS[day.design.track],
    items: [day.design.item],
    complete: (id) => complete(day.design.track === 'lld' ? setLld : setHld, id),
  };
  const extraPlan = day.date === today && plan?.date === today && !dsaTrack && !designTrack
    ? extraHomeworkPlan(plan, dsa)
    : null;

  return (
    <section aria-labelledby="homework-title" className="mb-8">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="homework-title" className="text-lg font-semibold tracking-tight text-ink">Homework</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <CalendarDays size={14} className="text-accent" aria-hidden="true" />
            {agendaDate.format(atNoon(day.date))}
          </p>
        </div>
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
      </header>

      {!dsaTrack && !designTrack && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="flex items-center gap-2 text-sm text-muted">
            <CheckCircle2 size={16} className="text-accent" aria-hidden="true" />
            {extraPlan ? 'Today’s homework is complete.' : 'No unfinished work for this day.'}
          </p>
          {extraPlan && (
            <button type="button" className="button-secondary"
              onClick={() => updateData((current) => current.homework === plan
                ? { ...current, homework: extraPlan }
                : current)}>
              Get more work
            </button>
          )}
        </div>
      )}
      <div className={`grid items-start gap-4 ${dsaTrack && designTrack ? 'lg:grid-cols-2' : ''}`}>
        {dsaTrack && <AgendaSection track={dsaTrack} onOpen={setActiveTab} />}
        <div className="grid min-w-0 gap-4">
          {designTrack && <AgendaSection track={designTrack} onOpen={setActiveTab} />}
          {children}
        </div>
      </div>
    </section>
  );
}
