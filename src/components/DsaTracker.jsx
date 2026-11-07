import { useState } from 'react';
import { ArrowUpRight, Upload } from 'lucide-react';
import { useCloudStorage } from '../hooks/useCloudStorage';
import { useWorkspace, useWorkspaceSaving, useWorkspaceValue } from '../hooks/useWorkspace';
import {
  allDsaSections, allDsaTopics, mergeDsaSolved, parseDsaSolvedLinks,
  PLANLY_DSA_URL, planlyDsaSections, planlyDsaTopics,
} from '../lib/dsaPlan';
import DsaProblemList from './DsaProblemList';
import { PageHeader, StatsStrip } from './ui/Workspace';

export default function DsaTracker() {
  const [scope, setScope] = useState('planly');
  const [showImport, setShowImport] = useState(false);
  const [links, setLinks] = useState('');
  const [notice, setNotice] = useState('');
  const { updateData } = useWorkspace();
  const saving = useWorkspaceSaving('dsa');
  const error = useWorkspaceValue((state) => state.error);
  const isPlanly = scope === 'planly';
  const [items, setItems] = useCloudStorage('dsa', isPlanly ? planlyDsaTopics : allDsaTopics);
  const sections = isPlanly ? planlyDsaSections : allDsaSections;
  const solved = items.filter((item) => item.completed).length;
  const percent = items.length ? Math.round(solved / items.length * 100) : 0;

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
        description="Pick the patterns you want to practice, then mark problems solved here."
        actions={
          <a href={PLANLY_DSA_URL} target="_blank" rel="noopener noreferrer" className="button-secondary">
            Open Planly DSA <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        }
      />
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="DSA problem list" className="inline-flex gap-1 rounded-xl border border-line bg-well p-1">
            {[
              ['planly', 'Planly problems'],
              ['all', 'All tracked'],
            ].map(([id, label]) => (
              <button key={id} type="button" aria-pressed={scope === id} onClick={() => setScope(id)}
                className={`rounded-lg px-3 py-2 text-sm ${scope === id ? 'bg-accent-soft font-medium text-accent' : 'text-muted hover:bg-hover hover:text-ink'}`}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="button-secondary" aria-expanded={showImport} aria-controls="dsa-import"
            onClick={() => { setShowImport(!showImport); setNotice(''); }}>
            <Upload size={15} /> Import solved links
          </button>
        </div>
        {showImport && (
          <form id="dsa-import" onSubmit={importSolved} className="panel space-y-3 p-4">
            <label htmlFor="dsa-solved-links" className="block text-sm font-medium">Solved TakeUForward problem links</label>
            <p className="text-xs text-muted">Paste one link per line. This only adds solves and keeps existing notes and progress.</p>
            <textarea id="dsa-solved-links" className="input-control" rows={5} maxLength={50000}
              spellCheck={false} value={links} onChange={(event) => { setLinks(event.target.value); setNotice(''); }} />
            <button type="submit" className="button-primary" disabled={!links.trim() || saving}>Mark imported problems solved</button>
          </form>
        )}
        {notice && <p role="status" className="text-xs text-muted">{notice}</p>}
      </div>
      <StatsStrip items={[
        { label: 'Solved', value: solved, detail: `of ${items.length} problems` },
        { label: 'Unsolved', value: items.length - solved, detail: 'Ready to practice' },
        { label: 'Your progress', value: `${percent}%`, detail: 'Synced across devices' },
      ]} />
      <div className="progress-track mt-[-1px] mb-4" role="progressbar" aria-label="DSA progress"
        aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className={`mb-5 text-xs ${error ? 'text-warning' : 'text-muted'}`} role="status">
        {error ? 'Unable to save progress to Firebase.' : saving ? 'Saving progress to Firebase…' : 'Progress saved to Firebase'}
      </p>
      <DsaProblemList items={items} setItems={setItems} sections={sections} />
    </div>
  );
}
