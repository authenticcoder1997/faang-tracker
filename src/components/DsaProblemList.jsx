import { memo, useCallback, useMemo, useState } from 'react';
import { BookOpen, Check, CheckCircle2, Circle, FileText, Search, SlidersHorizontal, X } from 'lucide-react';
import { filterDsaProblems } from '../lib/dsaFilters';
import NoteModal from './NoteModal';
import { EmptyState } from './ui/Workspace';

const initialFilters = { query: '', statuses: [], patterns: [], difficulties: [] };

function FilterTag({ label, count, active, onClick, pattern = false }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`dsa-filter-tag${pattern ? ' dsa-filter-pattern' : ''}`}
      onClick={onClick}
    >
      <span>{label}</span>
      {active && <Check size={13} aria-hidden="true" className="shrink-0" />}
      {count !== undefined && <span aria-hidden="true" className="dsa-filter-count">{count}</span>}
    </button>
  );
}

function DifficultyTag({ level }) {
  const tone = level === 'Easy' ? 'success' : level === 'Hard' ? 'danger' : 'warning';
  return <span className="status-pill" style={{ color: `var(--${tone})` }}>{level}</span>;
}

function StatusTag({ solved }) {
  return <span className={`status-pill${solved ? ' border-success/25 bg-success/8 text-success' : ''}`}>{solved ? 'Solved' : 'Unsolved'}</span>;
}

const ProblemRow = memo(function ProblemRow({ item, onToggle, onNote }) {
  const solved = !!item.completed;
  const label = solved ? 'Mark unsolved' : 'Mark solved';
  return (
    <tr className="border-t border-line transition-colors hover:bg-hover">
      <td className="w-11 pl-3 sm:w-14 sm:pl-4">
        <button
          type="button"
          className="completion-button"
          aria-pressed={solved}
          aria-label={`${label}: ${item.title}`}
          title={label}
          onClick={() => onToggle(item.id)}
        >
          {solved ? <CheckCircle2 size={20} aria-hidden="true" /> : <Circle size={20} aria-hidden="true" />}
        </button>
      </td>
      <td className="min-w-0 py-3 pr-3">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-words text-sm font-medium leading-6 text-ink hover:text-accent hover:underline underline-offset-4"
        >
          {item.title}
        </a>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:hidden">
          <span className="status-pill">{item.section}</span>
          <DifficultyTag level={item.difficulty} />
          <StatusTag solved={solved} />
        </div>
      </td>
      <td className="hidden px-3 py-3 md:table-cell">
        <span className="status-pill">{item.section}</span>
      </td>
      <td className="hidden px-3 py-3 md:table-cell">
        <DifficultyTag level={item.difficulty} />
      </td>
      <td className="hidden px-3 py-3 md:table-cell">
        <StatusTag solved={solved} />
      </td>
      <td className="w-12 pr-3 text-right">
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

export default function DsaProblemList({ items, setItems, sections }) {
  const [filters, setFilters] = useState(initialFilters);
  const [noteId, setNoteId] = useState(null);
  const activeNote = items.find((item) => item.id === noteId);
  const counts = useMemo(() => {
    const patterns = new Map();
    const difficulties = new Map();
    let solved = 0;
    for (const item of items) {
      if (item.completed) solved++;
      patterns.set(item.section, (patterns.get(item.section) || 0) + 1);
      difficulties.set(item.difficulty, (difficulties.get(item.difficulty) || 0) + 1);
    }
    return { patterns, difficulties, solved };
  }, [items]);
  const matchingItems = useMemo(() => filterDsaProblems(items, filters), [items, filters]);
  const filtering = !!filters.query.trim() || filters.statuses.length > 0 ||
    filters.patterns.length > 0 || filters.difficulties.length > 0;

  function toggleFilter(group, value) {
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
              onClick={() => setFilters(initialFilters)}>
              Clear all
            </button>
          )}
        </div>
        <div role="group" aria-labelledby="dsa-status-filters" className="mb-4">
          <h3 id="dsa-status-filters" className="eyebrow mb-2">Status</h3>
          <div className="flex flex-wrap gap-1.5">
            <FilterTag label="Solved" count={counts.solved} active={filters.statuses.includes('Solved')}
              onClick={() => toggleFilter('statuses', 'Solved')} />
            <FilterTag label="Unsolved" count={items.length - counts.solved} active={filters.statuses.includes('Unsolved')}
              onClick={() => toggleFilter('statuses', 'Unsolved')} />
          </div>
        </div>
        <div role="group" aria-labelledby="dsa-difficulty-filters" className="mb-4">
          <h3 id="dsa-difficulty-filters" className="eyebrow mb-2">Difficulty</h3>
          <div className="flex flex-wrap gap-1.5">
            {['Easy', 'Medium', 'Hard'].filter((level) => counts.difficulties.has(level)).map((level) => (
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
          <div className="flex flex-wrap gap-1 lg:grid">
            {sections.map(({ name }) => (
              <FilterTag key={name} label={name} count={counts.patterns.get(name)} pattern
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
              {matchingItems.length} of {items.length} shown
            </span>
          </div>
          <div className="search-field w-full sm:w-72">
            <Search size={15} aria-hidden="true" className="shrink-0" />
            <input
              aria-label="Search data structures & algorithms problems"
              placeholder="Find a problem…"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            />
            {filters.query && (
              <button type="button" aria-label="Clear search" className="hover:text-ink"
                onClick={() => setFilters((current) => ({ ...current, query: '' }))}>
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
                  <th scope="col" className="w-12"><span className="sr-only">Notes</span></th>
                </tr>
              </thead>
              <tbody>
                {matchingItems.map((item) => (
                  <ProblemRow key={item.id} item={item} onToggle={toggleProblem} onNote={setNoteId} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={SlidersHorizontal} title="No matching problems"
            description="Try a different search or remove a filter."
            action={<button type="button" className="button-secondary" onClick={() => setFilters(initialFilters)}>Clear filters</button>} />
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
