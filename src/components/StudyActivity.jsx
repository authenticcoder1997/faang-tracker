import { useMemo, useRef } from 'react';
import { studySessionsByDate } from '../lib/studySessions';
import { addDays } from '../lib/tasks';

const HOUR_MS = 3_600_000;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });
const fullDate = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
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
  const cells = useRef(new Map());
  const firstDate = `${today.slice(0, 7)}-01`;
  const month = dayTime(firstDate);
  const monthName = monthLabel.format(month);
  const totals = useMemo(() => new Map(
    [...studySessionsByDate(sessions, firstDate, today)].map(([day, entries]) =>
      [day, entries.reduce((total, { duration }) => total + duration, 0)]),
  ), [sessions, firstDate, today]);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstWeekday = (month.getDay() + 6) % 7;
  const activeDate = date >= firstDate && date <= today ? date : today;

  function moveDay(event, day) {
    const offsets = { ArrowUp: -7, ArrowDown: 7, ArrowLeft: -1, ArrowRight: 1 };
    const offset = offsets[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    const next = addDays(day, offset);
    const cell = cells.current.get(next);
    if (!cell || cell.disabled) return;
    onSelectDate(next);
    cell.focus();
  }

  return (
    <section aria-labelledby="study-activity-title" className="px-4 py-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="study-activity-title" className="section-heading">Study activity</h3>
        <p className="text-xs text-muted">{monthName}</p>
      </div>
      <div className="study-activity-grid" role="group" aria-label={`Study time by day in ${monthName}`}>
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="study-activity-weekday" aria-hidden="true">{weekday}</span>
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = addDays(firstDate, index);
          const calendarDate = dayTime(day);
          const position = firstWeekday + index;
          const column = position % 7 + 1;
          const duration = totals.get(day) ?? 0;
          const level = duration ? Math.max(1, Math.min(6, Math.floor(duration / HOUR_MS))) : 0;
          const future = day > today;
          const studied = timeLabel(duration);
          const label = `${fullDate.format(calendarDate)}${future ? '' : ` · ${studied}`}`;
          return (
            <button key={day} type="button" className="study-activity-cell" data-level={level}
              data-column={column} disabled={future}
              ref={(cell) => {
                if (cell) cells.current.set(day, cell);
                else cells.current.delete(day);
              }}
              style={{ gridRow: Math.floor(position / 7) + 2, gridColumn: column }}
              aria-label={label} aria-pressed={!future && day === date} tabIndex={day === activeDate ? 0 : -1}
              onClick={() => onSelectDate(day)} onKeyDown={(event) => moveDay(event, day)}>
              {index + 1}
              {!future && (
                <span className="study-activity-tooltip" aria-hidden="true">
                  {shortDate.format(calendarDate)} · {studied}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {date === activeDate && (
        <p className="mt-2 text-xs tabular-nums text-muted">
          {fullDate.format(dayTime(date))} · {timeLabel(totals.get(date) ?? 0)}
        </p>
      )}
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
