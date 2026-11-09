import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BookmarkCheck, ListTodo, Upload } from 'lucide-react';
import { useCloudStorage } from '../hooks/useCloudStorage';
import { useWorkspace, useWorkspaceSaving, useWorkspaceValue } from '../hooks/useWorkspace';
import {
  allDsaSections, mergeDsaSolved, parseDsaSolvedLinks, PLANLY_DSA_URL, planlyDsaTopics,
} from '../lib/dsaPlan';
import DsaProblemList from './DsaProblemList';
import DsaRevisionQueue from './DsaRevisionQueue';
import { dsaCatalog, DSA_SOURCES, matchesDsaSources } from '../lib/dsaCatalog';
import { EMPTY_DSA_FILTERS, filterDsaProblems } from '../lib/dsaFilters';
import { queueDsaRevision, reviewDsaProblem } from '../lib/dsaRevision';
import { dateKey } from '../lib/tasks';
import { PageHeader, StatsStrip } from './ui/Workspace';

const planlyIds = new Set(planlyDsaTopics.map((item) => item.id));
const sourceCounts = Object.fromEntries(DSA_SOURCES.map(([source]) => [
  source, dsaCatalog.filter((item) => item.sources[source]).length,
]));

export default function DsaTracker() {
  const [sources, setSources] = useState(['tuf']);
  const [planlyOnly, setPlanlyOnly] = useState(false);
  const [filters, setFilters] = useState(EMPTY_DSA_FILTERS);
  const [view, setView] = useState('problems');
  const [today, setToday] = useState(dateKey);
  const [showImport, setShowImport] = useState(false);
  const [links, setLinks] = useState('');
  const [notice, setNotice] = useState('');
  const { updateData } = useWorkspace();
  const progressSaving = useWorkspaceSaving('dsa');
  const revisionSaving = useWorkspaceSaving('revisions');
  const saving = progressSaving || revisionSaving;
  const error = useWorkspaceValue((state) => state.error);
  const [catalog, setItems] = useCloudStorage('dsa', dsaCatalog);
  const revisions = useWorkspaceValue((state) => state.data.revisions);
  const queuedIds = useMemo(() => new Set(revisions.map((record) => record.id)), [revisions]);
  const onlyPlanly = planlyOnly && sources.length === 1 && sources[0] === 'tuf';
  const items = useMemo(() => catalog.filter((item) => matchesDsaSources(item, sources) &&
    (!onlyPlanly || planlyIds.has(item.id))), [catalog, sources, onlyPlanly]);
  const matchingItems = useMemo(() => filterDsaProblems(items, filters, sources), [items, filters, sources]);
  const solved = matchingItems.filter((item) => item.completed).length;
  const percent = matchingItems.length ? Math.round(solved / matchingItems.length * 100) : 0;
  const due = revisions.filter((record) => record.dueDate <= today).length;

  useEffect(() => {
    const refresh = () => setToday(dateKey());
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, []);

  const toggleRevision = useCallback((id, source) => updateData((current) => ({
    ...current,
    revisions: current.revisions.some((record) => record.id === id)
      ? current.revisions.filter((record) => record.id !== id)
      : queueDsaRevision(current.revisions, id, source, dateKey()),
  })), [updateData]);

  const markReviewed = (id) => updateData((current) => ({
    ...current, revisions: reviewDsaProblem(current.revisions, id, dateKey()),
  }));
  const removeRevision = (id) => updateData((current) => ({
    ...current, revisions: current.revisions.filter((record) => record.id !== id),
  }));
  function importSolved(event) {
    event.preventDefault();
    const { ids, unmatched } = parseDsaSolvedLinks(links);
    if (!ids.length || unmatched.length) {
      setNotice(unmatched.length
        ? `${unmatched.length} link${unmatched.length === 1 ? '' : 's'} did not match a tracked problem. Remove those links and try again.`
        : 'Paste at least one TakeUForward problem link.');
      return;
    }
    let added = 0;
    const accepted = updateData((current) => {
      const before = current.progress.dsa;
      const dsa = mergeDsaSolved(before, ids);
      added = ids.filter((id) => !before[id]?.completed).length;
      return { ...current, progress: { ...current.progress, dsa } };
    });
    if (!accepted) {
      setNotice('Progress could not be updated. Try again.');
      return;
    }
    setNotice(added
      ? `Marked ${added} new problem${added === 1 ? '' : 's'} solved. ${ids.length - added} already marked solved.`
      : `All ${ids.length} matched problems were already marked solved.`);
    setLinks('');
    setShowImport(false);
  }

  return (
    <div className="page-frame study-page">
      <PageHeader
        eyebrow="Learning library"
        title="Data structures & algorithms"
        description="Choose a source, find a pattern, and save problems you want to revisit."
        actions={
          <a href={PLANLY_DSA_URL} target="_blank" rel="noopener noreferrer" className="button-secondary">
            Open Planly DSA <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        }
      />
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="DSA view" className="glass-segment inline-flex flex-wrap gap-1 rounded-xl border border-line p-1">
            {[
              ['problems', 'Problems', ListTodo],
              ['revision', 'Revision', BookmarkCheck],
            ].map(([id, label, Icon]) => (
              <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${view === id ? 'bg-accent-soft font-medium text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`}>
                <Icon size={15} aria-hidden="true" /> {label}
                {id === 'revision' && due > 0 && <span aria-hidden="true" className="status-pill">{due} due</span>}
              </button>
            ))}
          </div>
          {view === 'problems' && (
            <button type="button" className="button-secondary" aria-expanded={showImport} aria-controls="dsa-import"
              onClick={() => { setShowImport(!showImport); setNotice(''); }}>
              <Upload size={15} aria-hidden="true" /> Import solved links
            </button>
          )}
        </div>
        {view === 'problems' && showImport && (
          <form id="dsa-import" onSubmit={importSolved} className="panel space-y-3 p-4">
            <label htmlFor="dsa-solved-links" className="block text-sm font-medium">Solved TakeUForward problem links</label>
            <p className="text-xs text-muted">Paste one link per line. This only adds solves and keeps existing notes and progress.</p>
            <textarea id="dsa-solved-links" className="input-control" rows={5} maxLength={50000}
              spellCheck={false} value={links} onChange={(event) => { setLinks(event.target.value); setNotice(''); }} />
            <button type="submit" className="button-primary" disabled={!links.trim() || saving}>Mark imported problems solved</button>
          </form>
        )}
        {view === 'problems' && notice && <p role="status" className="text-xs text-muted">{notice}</p>}
      </div>
      <div hidden={view !== 'problems'}>
        <StatsStrip items={[
          { label: 'Solved', value: solved, detail: `of ${matchingItems.length} matching problems` },
          { label: 'Unsolved', value: matchingItems.length - solved, detail: 'Within current filters' },
          { label: 'Your progress', value: `${percent}%`, detail: 'Within current filters' },
        ]} />
        <div className="progress-track mt-[-1px] mb-4" role="progressbar" aria-label="Filtered DSA progress"
          aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <p className={`mb-5 text-xs ${error ? 'text-warning' : 'text-muted'}`} role="status">
          {error ? 'Unable to save progress to Firebase.' : saving ? 'Saving progress to Firebase…' : 'Progress saved to Firebase'}
        </p>
        <DsaProblemList items={items} matchingItems={matchingItems} setItems={setItems}
          filters={filters} setFilters={setFilters} sections={allDsaSections}
          sources={sources} setSources={setSources} sourceCounts={sourceCounts} planlyOnly={planlyOnly}
          setPlanlyOnly={setPlanlyOnly} queuedIds={queuedIds} onRevision={toggleRevision} />
      </div>
      <div hidden={view !== 'revision'}>
        <p role="status" className={`mb-4 text-xs ${error ? 'text-warning' : 'text-muted'}`}>
          {error ? 'Unable to save revisions to Firebase.' : revisionSaving ? 'Saving revisions…' : 'Revisions saved to Firebase'}
        </p>
        <DsaRevisionQueue revisions={revisions} catalog={catalog} today={today}
          onReviewed={markReviewed} onRemove={removeRevision} onBrowse={() => setView('problems')} />
      </div>
    </div>
  );
}
