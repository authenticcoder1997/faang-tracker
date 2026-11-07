import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useCloudStorage } from '../hooks/useCloudStorage';
import { useWorkspace, useWorkspaceSaving } from '../hooks/useWorkspace';
import {
  allDsaSections, allDsaTopics, mergeDsaSolved, parseDsaSolvedLinks,
  PLANLY_DSA_URL, planlyDsaSections, planlyDsaTopics,
} from '../lib/dsaPlan';
import StudyTracker from './StudyTracker';

export default function DsaTracker() {
  const [scope, setScope] = useState('planly');
  const [showImport, setShowImport] = useState(false);
  const [links, setLinks] = useState('');
  const [notice, setNotice] = useState('');
  const { updateData } = useWorkspace();
  const saving = useWorkspaceSaving('dsa');
  const isPlanly = scope === 'planly';
  const [items, setItems] = useCloudStorage('dsa', isPlanly ? planlyDsaTopics : allDsaTopics);

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
    <StudyTracker
      key={scope}
      id="dsa"
      title="Data structures & algorithms"
      description="Open a problem to practice, then mark it solved here. Your progress syncs across devices."
      sourceLabel="Planly DSA"
      sourceUrl={PLANLY_DSA_URL}
      items={items}
      setItems={setItems}
      sectionDefinitions={isPlanly ? planlyDsaSections : allDsaSections}
      initiallyCollapsed
      completedLabel="Solved"
      libraryLabel={isPlanly ? 'Planly sprint problems' : 'All tracked problems'}
      toolbar={(
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="DSA problem list" className="inline-flex gap-1 rounded-xl border border-line bg-well p-1">
              {[
                ['planly', 'Planly sprints'],
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
      )}
    />
  );
}
