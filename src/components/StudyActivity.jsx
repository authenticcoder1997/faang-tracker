import { useMemo, useRef } from 'react';
import { Star } from 'lucide-react';
import { studySessionsByDate } from '../lib/studySessions';
import { addDays } from '../lib/tasks';

const HOUR_MS = 3_600_000;
const STUDY_GOAL_HOURS = 6;
const FIRST_HIGHLIGHTED_DAY = '2026-11-11';
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
  const selectedTotal = totals.get(date) ?? 0;
  const selectedGoalReached = date >= FIRST_HIGHLIGHTED_DAY && selectedTotal >= STUDY_GOAL_HOURS * HOUR_MS;

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
    <section aria-labelledby="study-activity-title" className="px-4 py-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
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
          const muted = day < FIRST_HIGHLIGHTED_DAY;
          const level = !muted && duration
            ? Math.max(1, Math.min(STUDY_GOAL_HOURS, Math.floor(duration / HOUR_MS))) : 0;
          const future = day > today;
          const goalReached = level === STUDY_GOAL_HOURS;
          const studied = timeLabel(duration);
          const label = `${fullDate.format(calendarDate)}${future ? '' : ` · ${studied}`}`;
          return (
            <button key={day} type="button" className="study-activity-cell" data-level={level}
              data-column={column} data-muted={muted || undefined} disabled={future}
              ref={(cell) => {
                if (cell) cells.current.set(day, cell);
                else cells.current.delete(day);
              }}
              style={{ gridRow: Math.floor(position / 7) + 2, gridColumn: column }}
              aria-label={goalReached ? `${label} · Study goal reached` : label}
              aria-pressed={!future && day === date} tabIndex={day === activeDate ? 0 : -1}
              onClick={() => onSelectDate(day)} onKeyDown={(event) => moveDay(event, day)}>
              {goalReached ? (
                <span className="study-activity-goal" aria-hidden="true">
                  <Star size={30} className="study-activity-star" />
                  <span>{index + 1}</span>
                </span>
              ) : index + 1}
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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs tabular-nums text-muted">
            {fullDate.format(dayTime(date))} · {timeLabel(selectedTotal)}
          </p>
          {selectedGoalReached && (
            <span className="study-activity-goal-badge">{STUDY_GOAL_HOURS}+ h Star Goal</span>
          )}
        </div>
      )}
      <div className="mt-2 flex items-center justify-end gap-2 text-xs tabular-nums text-muted"
        aria-label={`Study time scale from 0 hours to a gold star at ${STUDY_GOAL_HOURS} hours`}>
        <span>0 h</span>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: STUDY_GOAL_HOURS }, (_, level) => (
            <span key={level} className="study-activity-cell" data-level={level} />
          ))}
        </div>
        <span className="inline-flex items-center gap-1">
          <Star size={15} className="study-activity-star" aria-hidden="true" /> {STUDY_GOAL_HOURS}+ h
        </span>
      </div>
    </section>
  );
}
