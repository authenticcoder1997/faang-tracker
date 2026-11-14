import { BookmarkCheck, BookmarkPlus, FileText } from 'lucide-react';
import { DSA_SOURCE_LABELS } from '../lib/dsaCatalog';
import { dueDateLabel } from '../lib/tasks';

const designSources = { lld: 'AlgoMaster', hld: 'Hello Interview' };
const difficultyColors = { Easy: 'success', Medium: 'warning', Hard: 'danger' };
const dueDateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' });

export default function HomeworkQuestionTags({ item, track, progress, revision, today, onRevision, onNotes }) {
  const isDsa = track === 'dsa';
  const source = isDsa
    ? item.source ?? Object.keys(item.sources ?? {}).find((key) => item.sources[key].url === item.url) ?? 'tuf'
    : track;
  const topics = isDsa
    ? item.patterns ?? item.sources?.[source]?.patterns ?? [item.topic || item.section]
    : [item.section, ...(item.pattern?.split(', ') ?? [])];
  const difficultyColor = difficultyColors[item.difficulty];
  const solved = progress?.completed ?? item.completed;
  const hasNote = Boolean((progress?.note ?? item.note)?.trim());
  const RevisionIcon = revision ? BookmarkCheck : BookmarkPlus;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
      {item.difficulty && (
        <span className="status-pill" style={difficultyColor ? { color: `var(--${difficultyColor})` } : undefined}>
          {item.difficulty}
        </span>
      )}
      {[...new Set(topics)].filter(Boolean).map((topic) => <span key={topic} className="status-pill">{topic}</span>)}
      {isDsa && <span className="status-pill">{solved ? 'Solved' : 'Unsolved'}</span>}
      <span className="status-pill">{isDsa ? DSA_SOURCE_LABELS[source] : designSources[track]}</span>
      {item.priority && <span className="status-pill">{item.priority} priority</span>}
      {item.premium && <span className="status-pill text-warning">Premium</span>}
      <button type="button" className="status-pill question-tag-action" data-active={revision ? '' : undefined}
        aria-pressed={!!revision} aria-label={`${revision ? 'Remove from revision' : 'Add to revision'}: ${item.title}`}
        onClick={() => onRevision(item.id, source)}>
        <RevisionIcon size={13} aria-hidden="true" /> Revision
      </button>
      {revision && (
        <time dateTime={revision.dueDate} title={dueDateFormat.format(new Date(`${revision.dueDate}T12:00:00`))}
          className={revision.dueDate < today ? 'text-warning' : ''}>
          {dueDateLabel(revision.dueDate, today)}
        </time>
      )}
      <button type="button" className="status-pill question-tag-action" data-active={hasNote ? '' : undefined}
        aria-label={`${hasNote ? 'Edit' : 'Add'} notes for ${item.title}`} aria-haspopup="dialog"
        onClick={() => onNotes(track, item)}>
        <FileText size={13} aria-hidden="true" /> Notes
      </button>
    </div>
  );
}
