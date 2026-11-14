import { useState } from 'react';
import { ArrowUpRight, CalendarCheck, Check, Trash2 } from 'lucide-react';
import { revisionQuestion } from '../lib/revisionQuestions';
import { DEFAULT_REVISION_DELAY_DAYS, revisionTrack } from '../lib/studyRevisions';
import { dueDateLabel } from '../lib/tasks';
import { useWorkspaceSaving, useWorkspaceValue } from '../hooks/useWorkspace';
import { EmptyState } from './ui/Workspace';

const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' });

function RevisionRows({ records, today, onReviewed, onRemove }) {
  return records.map((record) => {
    const entry = revisionQuestion(record);
    const reviewedToday = record.reviewedOn === today;
    const action = reviewedToday ? 'Reviewed today' : 'Mark reviewed';
    const name = entry?.title || record.id;
    return (
      <li key={record.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          {entry ? (
            <a href={entry.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-2 break-words text-sm font-medium text-ink hover:text-accent hover:underline">
              {entry.title}<ArrowUpRight size={13} aria-hidden="true" className="shrink-0" />
            </a>
          ) : <p className="text-sm text-muted">Question unavailable</p>}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="status-pill">{revisionTrack(record).toUpperCase()}</span>
            {entry?.sourceLabel && <span>{entry.sourceLabel}</span>}
            <span className={`font-medium ${record.dueDate < today ? 'text-warning' : 'text-secondary'}`}>
              {dueDateLabel(record.dueDate, today)}
            </span>
            <time dateTime={record.dueDate}>{dateFormat.format(new Date(`${record.dueDate}T12:00:00`))}</time>
            <span>{record.reviewCount} {record.reviewCount === 1 ? 'review' : 'reviews'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="button-secondary" disabled={reviewedToday || !entry}
            aria-label={`${action}: ${name}`} onClick={() => onReviewed(record.id)}>
            <Check size={15} aria-hidden="true" /> {action}
          </button>
          <button type="button" className="icon-button" title="Remove from revision"
            aria-label={`Remove from revision: ${name}`} onClick={() => onRemove(record.id)}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </li>
    );
  });
}

export default function RevisionQueue({ track, revisions, today, onReviewed, onRemove, onBrowse }) {
  const [filter, setFilter] = useState('due');
  const saving = useWorkspaceSaving('revisions');
  const error = useWorkspaceValue((state) => state.error);
  const ordered = [...revisions].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const due = ordered.filter((record) => record.dueDate <= today).length;
  const rows = ordered.filter((record) => filter === 'all' ||
    (filter === 'due' ? record.dueDate <= today : record.dueDate > today));

  return (
    <section className="revision-workspace" aria-labelledby={`${track}-revision-title`}>
      <p role="status" className={`mb-4 text-xs ${error ? 'text-warning' : 'text-muted'}`}>
        {error ? 'Unable to save revisions to Firebase.' : saving ? 'Saving revisions…' : 'Revisions saved to Firebase'}
      </p>
      <div className="revision-summary panel mb-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Spaced repetition</p>
            <h2 id={`${track}-revision-title`} className="text-xl font-semibold tracking-tight">Revision tracker</h2>
            <p className="mt-2 text-sm text-muted">
              Newly saved questions are due in {DEFAULT_REVISION_DELAY_DAYS} days.{' '}
              Mark a review done to schedule the next one.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Revision schedule">
            {[['due', 'Due', due], ['upcoming', 'Upcoming', ordered.length - due], ['all', 'All', ordered.length]]
              .map(([value, label, count]) => (
                <button key={value} type="button" aria-pressed={filter === value}
                  className="filter-tag" onClick={() => setFilter(value)}>
                  {label}<span className="dsa-filter-count">{count}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
      {rows.length ? (
        <ul className="study-section divide-y divide-line">
          <RevisionRows records={rows} today={today} onReviewed={onReviewed} onRemove={onRemove} />
        </ul>
      ) : (
        <EmptyState icon={CalendarCheck}
          title={ordered.length ? 'Nothing in this view' : 'Your revision queue is empty'}
          description={ordered.length ? 'Switch to All to see your saved reviews.' : 'Use the bookmark icon beside a question to add it.'}
          action={(
            <button type="button" className="button-secondary"
              onClick={ordered.length ? () => setFilter('all') : onBrowse}>
              {ordered.length ? 'See all revisions' : 'Browse problems'}
            </button>
          )} />
      )}
    </section>
  );
}
