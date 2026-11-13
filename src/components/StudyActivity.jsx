import { useEffect, useMemo, useRef } from 'react';
import { studySessionsByDate } from '../lib/studySessions';
import { addDays } from '../lib/tasks';

const WEEKS = 52;
const HOUR_MS = 3_600_000;
const monthLabel = new Intl.DateTimeFormat('en', { month: 'short' });
const fullDate = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const dayTime = (date) => new Date(`${date}T12:00:00`);

function timeLabel(duration) {
  if (!duration) return '0 h';
  const minutes = Math.floor(duration / 60_000);
  if (!minutes) return '<1 min';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours && `${hours} h`, remainder && `${remainder} min`].filter(Boolean).join(' ');
}

export default function StudyActivity({ date, today, sessions, onSelectDate }) {
  const scrollArea = useRef(null);
  const cells = useRef(new Map());
  const firstDate = addDays(today, -((dayTime(today).getDay() + 6) % 7) - (WEEKS - 1) * 7);
  const totals = useMemo(() => new Map(
    [...studySessionsByDate(sessions, firstDate, today)].map(([day, entries]) =>
      [day, entries.reduce((total, { duration }) => total + duration, 0)]),
  ), [sessions, firstDate, today]);
  const calendar = useMemo(() => Array.from({ length: WEEKS * 7 }, (_, index) => {
    const day = addDays(firstDate, index);
    return { day, column: Math.floor(index / 7) + 1, row: (index % 7) + 2 };
  }).filter(({ day }) => day <= today), [firstDate, today]);
  const months = calendar.filter(({ day, column }, index) => day.endsWith('-01') ||
    (index === 0 && !calendar.some((cell) => cell.column <= column + 1 && cell.day.endsWith('-01'))));
  const activeDate = date >= firstDate && date <= today ? date : today;

  useEffect(() => {
    const area = scrollArea.current;
    area.scrollLeft = area.scrollWidth;
  }, []);

  function moveDay(event, day) {
    const offsets = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
    const offset = offsets[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    const next = addDays(day, offset);
    const cell = cells.current.get(next);
    if (!cell) return;
    onSelectDate(next);
    cell.focus();
  }

  return (
    <section aria-labelledby="study-activity-title" className="panel mt-4 px-4 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="study-activity-title" className="section-heading">Study activity</h3>
        {date === activeDate && (
          <p className="text-xs tabular-nums text-muted">
            {fullDate.format(dayTime(date))} · {timeLabel(totals.get(date) ?? 0)}
          </p>
        )}
      </div>
      <div className="study-activity-scroll" ref={scrollArea}>
        <div className="study-activity-calendar">
          <div className="study-activity-weekdays" aria-hidden="true">
            <span>Mon</span><span>Wed</span><span>Fri</span>
          </div>
          <div className="study-activity-grid" role="group" aria-label="Study time by day over the last 52 weeks">
            {months.map(({ day, column }) => (
              <span key={day} className="study-activity-month" aria-hidden="true" style={{ gridColumn: column }}>
                {monthLabel.format(dayTime(day))}
              </span>
            ))}
            {calendar.map(({ day, row, column }) => {
              const duration = totals.get(day) ?? 0;
              const level = duration ? Math.max(1, Math.min(6, Math.floor(duration / HOUR_MS))) : 0;
              const label = `${fullDate.format(dayTime(day))} · ${timeLabel(duration)}`;
              return (
                <button key={day} type="button" className="study-activity-cell" data-level={level}
                  ref={(cell) => {
                    if (cell) cells.current.set(day, cell);
                    else cells.current.delete(day);
                  }}
                  style={{ gridRow: row, gridColumn: column }}
                  aria-label={label} title={label} aria-pressed={day === date} tabIndex={day === activeDate ? 0 : -1}
                  onClick={() => onSelectDate(day)} onKeyDown={(event) => moveDay(event, day)} />
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-2 text-xs tabular-nums text-muted" aria-label="Study time scale from 0 to 6 or more hours">
        <span>0 h</span>
        <div className="flex gap-1" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((level) => (
            <span key={level} className="study-activity-cell" data-level={level} />
          ))}
        </div>
        <span>6+ h</span>
      </div>
    </section>
  );
}
