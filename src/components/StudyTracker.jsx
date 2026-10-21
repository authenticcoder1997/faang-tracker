import { useId, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Circle,
  FileText,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import NoteModal from './NoteModal';
import { EmptyState, PageHeader, StatsStrip } from './ui/Workspace';

function Difficulty({ value }) {
  const tone =
    value === 'Easy' ? 'success' : value === 'Hard' ? 'danger' : 'warning';
  return value ? (
    <span className="status-pill" style={{ color: `var(--${tone})` }}>
      {value}
    </span>
  ) : null;
}

function Filter({ label, value, options, onChange }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex min-w-0 items-center gap-2 text-xs text-muted"
    >
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-control min-w-0 max-w-44 text-xs"
      >
        <option value="All">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function StudyTracker({
  id,
  title,
  description,
  sourceLabel,
  sourceUrl,
  items,
  setItems,
  sectionDefinitions,
  initiallyCollapsed = false,
  contextLabel,
  contextField,
  renderContext,
  priorityFilter = false,
  accessFilter = false,
  savingLocally = false,
}) {
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [context, setContext] = useState('All');
  const [priority, setPriority] = useState('All');
  const [access, setAccess] = useState('All');
  const [completion, setCompletion] = useState('All');
  const [collapsed, setCollapsed] = useState({});
  const [noteId, setNoteId] = useState(null);
  const activeNote = items.find((item) => item.id === noteId);

  const sectionNames = [
    ...new Set(items.map((item) => item.section).filter(Boolean)),
  ];
  const grouped = sectionDefinitions || sectionNames.map((name) => ({ name }));
  const sections = grouped.length
    ? grouped
    : [{ name: 'Practice library', ungrouped: true }];
  const hasGroups = !sections[0]?.ungrouped;
  const isCollapsed = (name) => collapsed[name] ?? initiallyCollapsed;
  const allCollapsed = sections.every((section) => isCollapsed(section.name));
  const totalCompleted = items.filter((item) => item.completed).length;
  const percent = items.length
    ? Math.round((totalCompleted / items.length) * 100)
    : 0;
  const completedSections = hasGroups
    ? sections.filter((section) => {
        const inSection = items.filter((item) => item.section === section.name);
        return (
          inSection.length > 0 && inSection.every((item) => item.completed)
        );
      }).length
    : 0;
  const contextOptions = contextField
    ? [
        ...new Set(
          items
            .flatMap((item) =>
              String(item[contextField] || '')
                .split(',')
                .map((part) => part.trim()),
            )
            .filter(Boolean),
        ),
      ].sort()
    : [];
  const filtering =
    query.trim() ||
    difficulty !== 'All' ||
    context !== 'All' ||
    priority !== 'All' ||
    access !== 'All' ||
    completion !== 'All';
  const matchingItems = items.filter((item) => {
    const matchesQuery =
      !query.trim() ||
      item.title.toLowerCase().includes(query.trim().toLowerCase());
    const matchesDifficulty =
      difficulty === 'All' || item.difficulty === difficulty;
    const matchesContext =
      context === 'All' ||
      String(item[contextField] || '')
        .split(',')
        .some((part) => part.trim() === context);
    const matchesPriority = priority === 'All' || item.priority === priority;
    const matchesAccess =
      access === 'All' ||
      (access === 'Premium' ? !!item.premium : !item.premium);
    const matchesCompletion =
      completion === 'All' ||
      (completion === 'Completed' ? item.completed : !item.completed);
    return (
      matchesQuery &&
      matchesDifficulty &&
      matchesContext &&
      matchesPriority &&
      matchesAccess &&
      matchesCompletion
    );
  });
  const dated = items.some((item) => item.date);

  const resetFilters = () => {
    setQuery('');
    setDifficulty('All');
    setContext('All');
    setPriority('All');
    setAccess('All');
    setCompletion('All');
  };
  const toggleItem = (itemId) =>
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    );
  const toggleSections = () =>
    setCollapsed(
      Object.fromEntries(
        sections.map((section) => [section.name, !allCollapsed]),
      ),
    );
  const rowsForSection = (section) =>
    section.ungrouped
      ? matchingItems
      : matchingItems.filter((item) => item.section === section.name);
  const updateFilter = (setter) => (value) => {
    setter(value);
    // Show matching rows immediately, while keeping section toggles usable.
    setCollapsed(
      Object.fromEntries(sections.map((section) => [section.name, false])),
    );
  };

  const renderRow = (item) => (
    <div
      key={item.id}
      className="flex items-start gap-3 border-t border-line px-4 py-4 transition-colors hover:bg-hover sm:gap-4 sm:px-5"
    >
      <button
        type="button"
        onClick={() => toggleItem(item.id)}
        aria-label={`${item.completed ? 'Mark incomplete' : 'Mark complete'}: ${item.title}`}
        aria-pressed={!!item.completed}
        className="completion-button mt-0.5 shrink-0"
      >
        {item.completed ? (
          <CheckCircle2 size={21} strokeWidth={1.6} aria-hidden="true" />
        ) : (
          <Circle size={21} strokeWidth={1.5} aria-hidden="true" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <a
          href={item.url || undefined}
          target={item.url ? '_blank' : undefined}
          rel={item.url ? 'noopener noreferrer' : undefined}
          className={`text-sm font-medium leading-6 transition-colors hover:text-accent hover:underline underline-offset-4 ${item.completed ? 'text-muted' : 'text-ink'}`}
        >
          {item.title}
        </a>
        {item.completed && <span className="sr-only">Completed</span>}
        {item.description && (
          <p className="mt-1 max-w-3xl line-clamp-1 text-xs leading-5 text-muted">
            {item.description}
          </p>
        )}
        {(contextField ||
          dated ||
          item.priority ||
          accessFilter ||
          item.practiceUrl) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-5 text-muted">
            {item.date && <span>{item.date}</span>}
            {contextField && item[contextField] && (
              <span>
                {renderContext ? renderContext(item) : item[contextField]}
              </span>
            )}
            {item.priority && <span>{item.priority} priority</span>}
            {accessFilter && (
              <span className={item.premium ? 'text-warning' : ''}>
                {item.premium ? 'Premium' : 'Free'}
              </span>
            )}
            {item.practiceUrl && (
              <a
                href={item.practiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline underline-offset-4"
              >
                Practice <ArrowUpRight size={11} />
              </a>
            )}
            <span className="sm:hidden">
              <Difficulty value={item.difficulty} />
            </span>
          </div>
        )}
        {!(
          contextField ||
          dated ||
          item.priority ||
          accessFilter ||
          item.practiceUrl
        ) && (
          <span className="mt-1 block sm:hidden">
            <Difficulty value={item.difficulty} />
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-5">
        <span className="hidden sm:block">
          <Difficulty value={item.difficulty} />
        </span>
        <button
          type="button"
          onClick={() => setNoteId(item.id)}
          aria-label={`${item.note ? 'Edit' : 'Add'} notes for ${item.title}`}
          title={item.note ? 'Edit notes' : 'Add notes'}
          className="icon-button"
          style={item.note ? { color: 'var(--accent)' } : undefined}
        >
          <FileText size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-frame study-page">
      <PageHeader
        eyebrow="Learning library"
        title={title}
        description={description}
        actions={
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button-secondary"
          >
            Open {sourceLabel}
            <ArrowUpRight size={15} />
          </a>
        }
      />

      <StatsStrip
        items={[
          {
            label: 'Completed',
            value: totalCompleted,
            detail: `of ${items.length} problems`,
          },
          {
            label: 'Your progress',
            value: `${percent}%`,
            detail: 'A little further, every day',
          },
          hasGroups
            ? {
                label: 'Sections finished',
                value: `${completedSections}/${sections.length}`,
                detail: 'Foundations to build on',
              }
            : {
                label: 'Left to explore',
                value: items.length - totalCompleted,
                detail: 'Systems worth understanding',
              },
        ]}
      />

      <div
        className="progress-track mt-[-1px] mb-8"
        role="progressbar"
        aria-label={`${title} progress`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>

      {savingLocally && (
        <p className="mb-5 text-xs text-muted" role="status">
          Your progress is saved on this device. Cloud sync is unavailable.
        </p>
      )}

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-heading flex items-center gap-2">
            <BookOpen size={16} className="text-accent" />
            Practice library{' '}
            <span className="ml-1 text-xs font-normal text-muted">
              {matchingItems.length}{' '}
              {matchingItems.length === 1 ? 'problem' : 'problems'}
            </span>
          </h2>
          {hasGroups && (
            <button
              type="button"
              className="button-secondary text-xs"
              onClick={toggleSections}
            >
              {allCollapsed ? (
                <ChevronsUpDown size={14} />
              ) : (
                <ChevronsDownUp size={14} />
              )}
              {allCollapsed ? 'Expand all' : 'Collapse all'}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="search-field flex min-w-48 flex-1 items-center gap-2 lg:max-w-sm">
            <Search
              size={15}
              className="shrink-0 text-faint"
              aria-hidden="true"
            />
            <input
              aria-label={`Search ${title.toLowerCase()} problems`}
              placeholder="Find a problem…"
              value={query}
              onChange={(event) => updateFilter(setQuery)(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none"
            />
            {query && (
              <button
                type="button"
                className="text-muted hover:text-ink"
                aria-label="Clear search"
                onClick={() => setQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Filter
            label="Difficulty"
            value={difficulty}
            options={['Easy', 'Medium', 'Hard']}
            onChange={updateFilter(setDifficulty)}
          />
          <Filter
            label="Status"
            value={completion}
            options={['To do', 'Completed']}
            onChange={updateFilter(setCompletion)}
          />
          {contextField && (
            <Filter
              label={contextLabel}
              value={context}
              options={contextOptions}
              onChange={updateFilter(setContext)}
            />
          )}
          {priorityFilter && (
            <Filter
              label="Priority"
              value={priority}
              options={['High', 'Medium', 'Low']}
              onChange={updateFilter(setPriority)}
            />
          )}
          {accessFilter && (
            <Filter
              label="Access"
              value={access}
              options={['Free', 'Premium']}
              onChange={updateFilter(setAccess)}
            />
          )}
          {filtering && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 py-2 text-xs text-accent hover:underline underline-offset-4"
              onClick={resetFilters}
            >
              <X size={13} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {matchingItems.length ? (
        <div className="study-table space-y-3">
          {sections.map((section, index) => {
            const rows = rowsForSection(section);
            if (!rows.length) return null;
            const allRows = section.ungrouped
              ? items
              : items.filter((item) => item.section === section.name);
            const done = allRows.filter((item) => item.completed).length;
            const closed = hasGroups && isCollapsed(section.name);
            const sectionId = `${id}-section-${index}`;
            return (
              <section
                key={section.name}
                className="study-section overflow-hidden rounded-xl border border-line bg-surface"
              >
                {hasGroups ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed((previous) => ({
                        ...previous,
                        [section.name]: !closed,
                      }))
                    }
                    aria-expanded={!closed}
                    aria-controls={sectionId}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-hover sm:px-5"
                  >
                    <span className="w-5 shrink-0 text-xs tabular-nums text-faint">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">
                        {section.name}
                      </span>
                      {section.date && (
                        <span className="mt-1 block text-[11px] text-muted">
                          {section.date}
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 text-xs tabular-nums ${done === allRows.length ? 'text-accent' : 'text-muted'}`}
                    >
                      {done}/{allRows.length}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 text-muted transition-transform ${closed ? '-rotate-90' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-4 px-5 py-3 text-[11px] text-muted">
                    <span>Interview questions</span>
                    <span>Difficulty & notes</span>
                  </div>
                )}
                {!closed && <div id={sectionId}>{rows.map(renderRow)}</div>}
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={SlidersHorizontal}
          title="A little too specific."
          description="No problems match these filters. Try another search or open up your filters."
          action={
            <button
              type="button"
              className="button-secondary"
              onClick={resetFilters}
            >
              Clear filters
            </button>
          }
        />
      )}

      <NoteModal
        isOpen={!!activeNote}
        onClose={() => setNoteId(null)}
        initialNote={activeNote?.note}
        problemTitle={activeNote?.title}
        onSave={(note) => {
          if (activeNote && activeNote.note !== note)
            setItems(
              items.map((item) =>
                item.id === activeNote.id ? { ...item, note } : item,
              ),
            );
        }}
      />
    </div>
  );
}
