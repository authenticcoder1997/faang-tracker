import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Coffee,
  ExternalLink,
  Layers,
  Lock,
  Monitor,
} from 'lucide-react';
import { DSA_SECTIONS_LIST } from '../data/dsaTopics';
import { EmptyState, PageHeader, StatsStrip } from './ui/Workspace';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
// All scheduled dayIndex values are offsets from 31 July 2026.
const EPOCH = new Date(2026, 6, 31);

function dateFromIndex(index) {
  const date = new Date(EPOCH);
  date.setDate(date.getDate() + index);
  return date;
}

function formatIndex(index) {
  const date = dateFromIndex(index);
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}`;
}

function todayIndex() {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  return Math.round((startOfToday - EPOCH) / 86400000);
}

function nextScheduledIndex(items, fromIndex) {
  let best = null;
  for (const item of items) {
    if (typeof item.dayIndex === 'number' && item.dayIndex > fromIndex) {
      if (best === null || item.dayIndex < best) best = item.dayIndex;
    }
  }
  return best;
}

function AgendaSection({ track, onOpen }) {
  const Icon = track.icon;
  const completed = track.items.filter((item) => item.completed).length;

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
            {track.items.length > 0 && (
              <span className="status-pill tabular-nums">
                {completed}/{track.items.length}
              </span>
            )}
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

      {track.items.length > 0 ? (
        <ul className="divide-y divide-line">
          {track.items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-hover sm:px-6"
            >
              <button
                type="button"
                onClick={() => track.toggle(item.id)}
                aria-pressed={!!item.completed}
                aria-label={`${item.completed ? 'Mark incomplete' : 'Mark complete'}: ${item.title}`}
                title={item.completed ? 'Mark incomplete' : 'Mark complete'}
                className="completion-button mt-0.5 shrink-0"
              >
                {item.completed ? (
                  <CheckCircle2 size={21} />
                ) : (
                  <Circle size={21} />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`break-words text-sm font-semibold leading-6 transition-colors hover:text-accent ${item.completed ? 'text-muted line-through' : 'text-ink'}`}
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
      ) : (
        <div className="agenda-empty">
          <EmptyState
            icon={track.allDone ? CheckCircle2 : Coffee}
            title={track.allDone ? `${track.label} complete` : 'A lighter day'}
            description={
              track.allDone
                ? `All ${track.total} ${track.completionLabel} completed.`
                : track.nextIndex !== null
                  ? `Your next ${track.label} session is on ${formatIndex(track.nextIndex)}.`
                  : `No more ${track.label} sessions are scheduled.`
            }
          />
        </div>
      )}
    </section>
  );
}

export default function DailyHome({
  dsa,
  lld,
  hld,
  concurrency,
  setDsa,
  setLld,
  setHld,
  setConcurrency,
  setActiveTab,
}) {
  const todayIdx = todayIndex();
  const totalDays =
    Math.max(
      todayIdx + 1,
      ...DSA_SECTIONS_LIST.map((section) =>
        typeof section.dayIndex === 'number' ? section.dayIndex : -1,
      ),
      ...lld.map((item) =>
        typeof item.dayIndex === 'number' ? item.dayIndex : -1,
      ),
      ...hld.map((item) =>
        typeof item.dayIndex === 'number' ? item.dayIndex : -1,
      ),
      ...concurrency.map((item) =>
        typeof item.dayIndex === 'number' ? item.dayIndex : -1,
      ),
    ) + 1;
  const [selectedDayIndex, setSelectedDayIndex] = useState(
    Math.min(Math.max(todayIdx, 0), totalDays - 1),
  );

  const selectedSectionNames = DSA_SECTIONS_LIST.filter(
    (section) => section.dayIndex === selectedDayIndex,
  ).map((section) => section.name);
  const todayDsaQuestions = selectedSectionNames.length
    ? dsa.filter((item) => selectedSectionNames.includes(item.section))
    : [];
  const nextLld = lld.filter((item) => item.dayIndex === selectedDayIndex);
  const nextHld = hld.filter((item) => item.dayIndex === selectedDayIndex);
  const nextConcurrency = concurrency.filter(
    (item) => item.dayIndex === selectedDayIndex,
  );

  function toggle(items, setItems, id) {
    if (!setItems) return;
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  }

  const totalDsa = dsa.filter((item) => item.completed).length;
  const totalLld = lld.filter((item) => item.completed).length;
  const totalHld = hld.filter((item) => item.completed).length;
  const totalConcurrency = concurrency.filter((item) => item.completed).length;
  const selectedItems = [
    ...todayDsaQuestions,
    ...nextLld,
    ...nextHld,
    ...nextConcurrency,
  ];
  const selectedCompleted = selectedItems.filter(
    (item) => item.completed,
  ).length;
  const selectedProgress = selectedItems.length
    ? Math.round((selectedCompleted / selectedItems.length) * 100)
    : 0;
  const selectedWeekday = new Intl.DateTimeFormat('en', {
    weekday: 'long',
  }).format(dateFromIndex(selectedDayIndex));

  const tracks = [
    {
      id: 'dsa',
      label: 'DSA',
      title: 'DSA practice',
      icon: BookOpen,
      subtitle: selectedSectionNames.length
        ? selectedSectionNames.join(' & ')
        : 'Concept revision · TakeUForward',
      items: todayDsaQuestions,
      total: dsa.length,
      allDone: totalDsa === dsa.length,
      nextIndex: nextScheduledIndex(DSA_SECTIONS_LIST, selectedDayIndex),
      toggle: (id) => toggle(dsa, setDsa, id),
      source: 'TakeUForward',
      completionLabel: 'DSA problems',
    },
    {
      id: 'lld',
      label: 'LLD',
      title: 'Low-level design',
      icon: Layers,
      subtitle: 'Design patterns & practice · Algomaster',
      items: nextLld,
      total: lld.length,
      allDone: totalLld === lld.length,
      nextIndex: nextScheduledIndex(lld, selectedDayIndex),
      toggle: (id) => toggle(lld, setLld, id),
      source: 'Algomaster',
      completionLabel: 'LLD problems',
    },
    {
      id: 'hld',
      label: 'HLD',
      title: 'System design',
      icon: Monitor,
      subtitle: 'System breakdowns · HelloInterview',
      items: nextHld,
      total: hld.length,
      allDone: totalHld === hld.length,
      nextIndex: nextScheduledIndex(hld, selectedDayIndex),
      toggle: (id) => toggle(hld, setHld, id),
      source: 'HelloInterview',
      completionLabel: 'HLD breakdowns',
    },
    {
      id: 'concurrency',
      label: 'Concurrency',
      title: 'Concurrency',
      icon: Lock,
      subtitle: 'Threading & coordination · Algomaster',
      items: nextConcurrency,
      total: concurrency.length,
      allDone: totalConcurrency === concurrency.length,
      nextIndex: nextScheduledIndex(concurrency, selectedDayIndex),
      toggle: (id) => toggle(concurrency, setConcurrency, id),
      source: 'Algomaster',
      completionLabel: 'concurrency problems',
    },
  ];

  return (
    <div className="page-frame">
      <PageHeader
        eyebrow={`Study plan · Day ${selectedDayIndex + 1} of ${totalDays}`}
        title="Homework"
        description="A focused daily agenda for algorithms, design, and concurrency."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDayIndex(todayIdx)}
              className="button-secondary"
            >
              Today
            </button>
            <div className="flex min-w-0 items-center gap-1 rounded-xl border border-line bg-surface p-1">
              <button
                type="button"
                onClick={() =>
                  setSelectedDayIndex((previous) => Math.max(0, previous - 1))
                }
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
                value={selectedDayIndex}
                onChange={(event) =>
                  setSelectedDayIndex(Number(event.target.value))
                }
                className="min-w-24 cursor-pointer appearance-none bg-transparent px-1 py-2 text-center text-sm font-medium text-ink outline-none focus-visible:outline-2 focus-visible:outline-accent"
                style={{ textAlignLast: 'center' }}
              >
                {Array.from({ length: totalDays }, (_, index) => (
                  <option key={index} value={index}>
                    {formatIndex(index)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setSelectedDayIndex((previous) =>
                    Math.min(totalDays - 1, previous + 1),
                  )
                }
                disabled={selectedDayIndex >= totalDays - 1}
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
            label: 'DSA',
            value: `${totalDsa}/${dsa.length}`,
            detail: 'problems completed',
          },
          {
            label: 'LLD',
            value: `${totalLld}/${lld.length}`,
            detail: 'problems completed',
          },
          {
            label: 'HLD',
            value: `${totalHld}/${hld.length}`,
            detail: 'breakdowns completed',
          },
          {
            label: 'Concurrency',
            value: `${totalConcurrency}/${concurrency.length}`,
            detail: 'problems completed',
          },
        ]}
      />

      <div className="mb-5 mt-9 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="eyebrow mb-2">Daily agenda</p>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
            <CalendarDays size={17} className="text-accent" />
            {selectedWeekday}, {formatIndex(selectedDayIndex)}
          </h2>
        </div>
        <div className="w-full sm:w-52" aria-label="Selected day progress">
          <div className="mb-2 flex items-center justify-between gap-4 text-xs">
            <span className="text-muted">
              {selectedItems.length
                ? `${selectedCompleted} of ${selectedItems.length} complete`
                : 'No study scheduled'}
            </span>
            {selectedItems.length > 0 && (
              <span className="font-medium tabular-nums text-accent">
                {selectedProgress}%
              </span>
            )}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${selectedProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        {tracks.map((track) => (
          <AgendaSection key={track.id} track={track} onOpen={setActiveTab} />
        ))}
      </div>
    </div>
  );
}
