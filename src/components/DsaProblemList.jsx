import { memo, useCallback, useMemo, useState } from 'react';
import { BookOpen, BookmarkCheck, BookmarkPlus, Check, CheckCircle2, Circle, FileText, Search, SlidersHorizontal, X } from 'lucide-react';
import { EMPTY_DSA_FILTERS, filterDsaProblems } from '../lib/dsaFilters';
import { DSA_SOURCES, DSA_SOURCE_LABELS, dsaPatternsFor, dsaSourceFor } from '../lib/dsaCatalog';
import NoteModal from './NoteModal';
import CompletionDate from './CompletionDate';
import { EmptyState } from './ui/Workspace';

const PAGE_SIZE = 60;

function FilterTag({ label, count, active, onClick, pattern = false }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`filter-tag${pattern ? ' dsa-filter-pattern' : ''}`}
      onClick={onClick}
    >
      <span>{label}</span>
      {active && <Check size={13} aria-hidden="true" className="shrink-0" />}
      {count !== undefined && <span aria-hidden="true" className="dsa-filter-count">{count}</span>}
    </button>
  );
}

function DifficultyTag({ level }) {
  const tone = level === 'Easy' ? 'success' : level === 'Hard' ? 'danger' : level === 'Medium' ? 'warning' : 'text-muted';
  return <span className="status-pill" style={{ color: `var(--${tone})` }}>{level}</span>;
}

function StatusTag({ solved }) {
  return <span className={`status-pill${solved ? ' border-success/25 bg-success/8 text-success' : ''}`}>{solved ? 'Solved' : 'Unsolved'}</span>;
}

const ProblemRow = memo(function ProblemRow({ item, sources, patterns, queued, onToggle, onNote, onRevision }) {
  const solved = !!item.completed;
  const source = dsaSourceFor(item, sources);
  const link = item.sources[source];
  const available = dsaPatternsFor(item, sources);
  const pattern = available.find((name) => patterns.includes(name)) || available[0] || item.section;
  const sourceLabel = DSA_SOURCE_LABELS[source];
  const sourceNames = Object.keys(item.sources).map((key) => DSA_SOURCE_LABELS[key]);
  const label = solved ? 'Mark unsolved' : 'Mark solved';
  return (
    <tr className="border-t border-line transition-colors hover:bg-hover">
      <td className="w-11 pl-3 sm:w-14 sm:pl-4">
        <button
          type="button"
          className="completion-button"
          aria-pressed={solved}
          aria-label={`${label}: ${link.title}`}
          title={label}
          onClick={() => onToggle(item.id)}
        >
          {solved ? <CheckCircle2 size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
        </button>
      </td>
      <td className="min-w-0 py-3 pr-3">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-words text-sm font-medium leading-6 text-ink hover:text-accent hover:underline underline-offset-4"
        >
          {link.title}
        </a>
        {solved && <CompletionDate date={item.completedOn} />}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:hidden">
          <span className="status-pill">{pattern}</span>
          <DifficultyTag level={item.difficulty} />
          <StatusTag solved={solved} />
          <span className="status-pill" title={sourceNames.join(', ')}>{sourceLabel}</span>
        </div>
      </td>
      <td className="hidden px-3 py-3 md:table-cell">
        <span className="status-pill">{pattern}</span>
      </td>
      <td className="hidden px-3 py-3 md:table-cell">
        <DifficultyTag level={item.difficulty} />
      </td>
      <td className="hidden px-3 py-3 md:table-cell">
        <StatusTag solved={solved} />
      </td>
      <td className="hidden px-3 py-3 md:table-cell">
        <span className="status-pill" title={sourceNames.join(', ')}>{sourceLabel}</span>
      </td>
      <td className="w-16 pr-2 text-right sm:w-22">
        <button
          type="button"
          className={`icon-button ${queued ? 'text-accent' : ''}`}
          aria-pressed={queued}
          aria-label={`${queued ? 'Remove from revision' : 'Add to revision'}: ${link.title}`}
          title={queued ? 'Remove from revision' : 'Add to revision'}
          onClick={() => onRevision(item.id, source)}
        >
          {queued ? <BookmarkCheck size={16} aria-hidden="true" /> : <BookmarkPlus size={16} aria-hidden="true" />}
        </button>
        <button
          type="button"
          className={`icon-button ${item.note ? 'text-accent' : ''}`}
          aria-label={`${item.note ? 'Edit' : 'Add'} notes for ${item.title}`}
          title={item.note ? 'Edit notes' : 'Add notes'}
          onClick={() => onNote(item.id)}
        >
          <FileText size={16} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
});

export default function DsaProblemList({
  items, matchingItems, setItems, filters, setFilters, sections, sources, setSources,
  sourceCounts, queuedIds, onRevision,
}) {
  const [noteId, setNoteId] = useState(null);
  const [patternQuery, setPatternQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const activeNote = items.find((item) => item.id === noteId);
  const available = useMemo(() => {
    const patterns = new Set();
    const difficulties = new Set();
    for (const item of items) {
      for (const name of dsaPatternsFor(item, sources)) patterns.add(name);
      difficulties.add(item.difficulty);
    }
    return { patterns, difficulties };
  }, [items, sources]);
  // Each group counts the options available with the other filters applied.
  const statusItems = useMemo(() => filters.statuses.length
    ? filterDsaProblems(items, { ...filters, statuses: [] }, sources)
    : matchingItems, [items, filters, sources, matchingItems]);
  const solvedOptionCount = statusItems.filter((item) => item.completed).length;
  const patternCounts = useMemo(() => {
    const patternItems = filters.patterns.length
      ? filterDsaProblems(items, { ...filters, patterns: [] }, sources)
      : matchingItems;
    const counts = new Map();
    for (const item of patternItems) {
      for (const name of dsaPatternsFor(item, sources)) counts.set(name, (counts.get(name) || 0) + 1);
    }
    return counts;
  }, [items, filters, sources, matchingItems]);
  const patternOptions = [...new Set([
    ...sections.map(({ name }) => name), ...[...available.patterns].sort(), ...filters.patterns,
  ])].filter((name) => (available.patterns.has(name) || filters.patterns.includes(name)) &&
    (!patternQuery.trim() || filters.patterns.includes(name) || name.toLowerCase().includes(patternQuery.trim().toLowerCase())));
  const visibleLimit = Math.min(limit, matchingItems.length);
  const filtering = !!filters.query.trim() || filters.statuses.length > 0 ||
    filters.patterns.length > 0 || filters.difficulties.length > 0 || sources.length > 0;

  function clearFilters() {
    setFilters(EMPTY_DSA_FILTERS);
    setSources([]);
    setPatternQuery('');
    setLimit(PAGE_SIZE);
  }

  function toggleSource(source) {
    setLimit(PAGE_SIZE);
    setSources((current) => current.includes(source)
      ? current.filter((value) => value !== source)
      : [...current, source]);
  }

  function toggleFilter(group, value) {
    setLimit(PAGE_SIZE);
    setFilters((current) => {
      const selected = current[group];
      return {
        ...current,
        [group]: selected.includes(value)
          ? selected.filter((entry) => entry !== value)
          : [...selected, value],
      };
    });
  }

  const toggleProblem = useCallback((id) => setItems((current) => current.map((item) =>
    item.id === id ? { ...item, completed: !item.completed } : item,
  )), [setItems]);

  return (
    <div className="dsa-workspace grid min-w-0 gap-6">
      <aside className="dsa-filter-sidebar min-w-0 border-line" aria-label="DSA filters">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="section-heading flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-accent" aria-hidden="true" /> Filters
          </h2>
          {filtering && (
            <button type="button" className="shrink-0 text-xs text-accent hover:underline"
              onClick={clearFilters}>
              Clear all
            </button>
          )}
        </div>
        <div role="group" aria-labelledby="dsa-source-filters" className="mb-4">
          <h3 id="dsa-source-filters" className="eyebrow mb-2">Source</h3>
          <div className="flex flex-wrap gap-1.5">
            {DSA_SOURCES.map(([source, label]) => (
              <FilterTag key={source} label={label} count={sourceCounts[source]}
                active={sources.includes(source)} onClick={() => toggleSource(source)} />
            ))}
          </div>
        </div>
        <div role="group" aria-labelledby="dsa-status-filters" className="mb-4">
          <h3 id="dsa-status-filters" className="eyebrow mb-2">Status</h3>
          <div className="flex flex-wrap gap-1.5">
            <FilterTag label="Solved" count={solvedOptionCount} active={filters.statuses.includes('Solved')}
              onClick={() => toggleFilter('statuses', 'Solved')} />
            <FilterTag label="Unsolved" count={statusItems.length - solvedOptionCount} active={filters.statuses.includes('Unsolved')}
              onClick={() => toggleFilter('statuses', 'Unsolved')} />
          </div>
        </div>
        <div role="group" aria-labelledby="dsa-difficulty-filters" className="mb-4">
          <h3 id="dsa-difficulty-filters" className="eyebrow mb-2">Difficulty</h3>
          <div className="flex flex-wrap gap-1.5">
            {['Easy', 'Medium', 'Hard', 'Unrated'].filter((level) => available.difficulties.has(level)).map((level) => (
              <FilterTag key={level} label={level} active={filters.difficulties.includes(level)}
                onClick={() => toggleFilter('difficulties', level)} />
            ))}
          </div>
        </div>
        <div role="group" aria-labelledby="dsa-pattern-filters">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 id="dsa-pattern-filters" className="eyebrow mb-0">Patterns</h3>
            <span className="text-[11px] text-muted">Select any</span>
          </div>
          {(available.patterns.size > 18 || patternQuery) && (
            <input type="search" className="input-control mb-2 py-1.5 text-xs"
              aria-label="Find a pattern" placeholder="Find a pattern…" value={patternQuery}
              onChange={(event) => setPatternQuery(event.target.value)} />
          )}
          <div className="flex flex-wrap gap-1 lg:grid">
            {patternOptions.map((name) => (
              <FilterTag key={name} label={name} count={patternCounts.get(name) || 0} pattern
                active={filters.patterns.includes(name)} onClick={() => toggleFilter('patterns', name)} />
            ))}
          </div>
        </div>
      </aside>

      <section className="min-w-0" aria-label="DSA problem list">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="section-heading flex items-center gap-2">
              <BookOpen size={16} className="text-accent" aria-hidden="true" /> Problems
            </h2>
            <span role="status" className="text-xs text-muted">
              Showing {visibleLimit}{visibleLimit < matchingItems.length && ` of ${matchingItems.length}`}{' '}
              {matchingItems.length === 1 ? 'problem' : 'problems'}
            </span>
          </div>
          <div className="search-field w-full sm:w-72">
            <Search size={15} aria-hidden="true" className="shrink-0" />
            <input
              aria-label="Search data structures & algorithms problems"
              placeholder="Find a problem…"
              value={filters.query}
              onChange={(event) => {
                setLimit(PAGE_SIZE);
                setFilters((current) => ({ ...current, query: event.target.value }));
              }}
            />
            {filters.query && (
              <button type="button" aria-label="Clear search" className="hover:text-ink"
                onClick={() => {
                  setLimit(PAGE_SIZE);
                  setFilters((current) => ({ ...current, query: '' }));
                }}>
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        {matchingItems.length ? (
          <div className="study-section">
            <table className="w-full border-collapse text-left">
              <thead className="bg-well text-[11px] font-medium text-muted">
                <tr>
                  <th scope="col" className="w-11 sm:w-14"><span className="sr-only">Mark solved</span></th>
                  <th scope="col" className="py-3">Problem</th>
                  <th scope="col" className="hidden px-3 md:table-cell">Pattern</th>
                  <th scope="col" className="hidden px-3 md:table-cell">Difficulty</th>
                  <th scope="col" className="hidden px-3 md:table-cell">Status</th>
                  <th scope="col" className="hidden px-3 md:table-cell">Source</th>
                  <th scope="col" className="w-16 sm:w-22"><span className="sr-only">Revision and notes</span></th>
                </tr>
              </thead>
              <tbody>
                {matchingItems.slice(0, visibleLimit).map((item) => (
                  <ProblemRow key={item.id} item={item} sources={sources} patterns={filters.patterns}
                    queued={queuedIds.has(item.id)} onToggle={toggleProblem} onNote={setNoteId} onRevision={onRevision} />
                ))}
              </tbody>
            </table>
            {visibleLimit < matchingItems.length && (
              <div className="flex flex-wrap items-center justify-center gap-3 border-t border-line p-3">
                <span className="text-xs text-muted">Showing {visibleLimit} of {matchingItems.length}</span>
                <button type="button" className="button-secondary" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
                  Show more
                </button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState icon={SlidersHorizontal} title="No matching problems"
            description="Try a different search or remove a filter."
            action={<button type="button" className="button-secondary" onClick={clearFilters}>Clear filters</button>} />
        )}
      </section>

      <NoteModal
        isOpen={!!activeNote}
        onClose={() => setNoteId(null)}
        initialNote={activeNote?.note}
        problemTitle={activeNote?.title}
        onSave={(note) => {
          if (activeNote && activeNote.note !== note)
            setItems((current) => current.map((item) =>
              item.id === activeNote.id ? { ...item, note } : item,
            ));
        }}
      />
    </div>
  );
}
