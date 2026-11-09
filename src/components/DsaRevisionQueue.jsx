import { useMemo, useState } from 'react';
import { ArrowUpRight, CalendarCheck, Check, Trash2 } from 'lucide-react';
import { DSA_SOURCE_LABELS, dsaSourceFor } from '../lib/dsaCatalog';
import { allDsaTopics } from '../lib/dsaPlan';
import { EmptyState } from './ui/Workspace';

const earlierTufItems = new Map(allDsaTopics.map((item) => [item.id, item]));

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(value + 'T12:00:00'));
}

export default function DsaRevisionQueue({ revisions, catalog, today, onReviewed, onRemove, onBrowse }) {
  const [filter, setFilter] = useState('due');
  const byId = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog]);
  const ordered = useMemo(() => [...revisions].sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [revisions]);
  const due = ordered.filter((record) => record.dueDate <= today).length;
  const rows = ordered.filter((record) => filter === 'all' ||
    (filter === 'due' ? record.dueDate <= today : record.dueDate > today));

  return (
    <section className="revision-workspace" aria-labelledby="dsa-revision-title">
      <div className="revision-summary panel mb-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Spaced repetition</p>
            <h2 id="dsa-revision-title" className="text-xl font-semibold tracking-tight">Revision tracker</h2>
            <p className="mt-2 text-sm text-muted">
              Save problems from the list. Mark a review done to schedule the next one.
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
          {rows.map((record) => {
            const item = byId.get(record.id);
            const earlierTuf = !item || (record.source === 'tuf' && !item.sources.tuf)
              ? earlierTufItems.get(record.id)
              : undefined;
            const source = earlierTuf ? 'tuf' : item && (item.sources[record.source] ? record.source : dsaSourceFor(item));
            const entry = earlierTuf || item?.sources[source];
            const reviewedToday = record.reviewedOn === today;
            return (
              <li key={record.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
                <div className="min-w-0 flex-1">
                  {entry ? (
                    <a href={entry.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-2 break-words text-sm font-medium text-ink hover:text-accent hover:underline">
                      {entry.title}<ArrowUpRight size={13} aria-hidden="true" className="shrink-0" />
                    </a>
                  ) : <p className="text-sm text-muted">Problem unavailable</p>}
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                    {source && <span>{DSA_SOURCE_LABELS[source]}</span>}
                    <span className={record.dueDate < today ? 'text-warning' : ''}>
                      {record.dueDate < today ? 'Overdue · ' : record.dueDate === today ? 'Due today · ' : 'Next · '}
                      {formatDate(record.dueDate)}
                    </span>
                    <span>{record.reviewCount} {record.reviewCount === 1 ? 'review' : 'reviews'}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="button-secondary" disabled={reviewedToday || !entry}
                    aria-label={`Mark reviewed: ${entry?.title || record.id}`}
                    onClick={() => onReviewed(record.id)}>
                    <Check size={15} aria-hidden="true" /> {reviewedToday ? 'Reviewed today' : 'Mark reviewed'}
                  </button>
                  <button type="button" className="icon-button" title="Remove from revision"
                    aria-label={`Remove from revision: ${entry?.title || record.id}`}
                    onClick={() => onRemove(record.id)}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={CalendarCheck}
          title={ordered.length ? 'Nothing in this view' : 'Your revision queue is empty'}
          description={ordered.length ? 'Switch to All to see your saved reviews.' : 'Use the bookmark icon beside a DSA problem to add it.'}
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
