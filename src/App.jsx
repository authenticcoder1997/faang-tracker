import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Monitor,
  RefreshCw,
  GitBranch,
  FileText,
  Lock,
  ListTodo,
  PanelsTopLeft,
  MoreHorizontal,
  Bookmark,
  Cloud,
  CloudOff,
  LoaderCircle,
} from 'lucide-react';
import { useCloudStorage } from './hooks/useCloudStorage';
import { useCloudNotes } from './hooks/useCloudNotes';
import DailyHome from './components/DailyHome';
import TaskHome from './components/TaskHome';
import ImportantLinks from './components/ImportantLinks';
import ThemeSwitcher from './components/ThemeSwitcher';
import { useTheme } from './hooks/useTheme';
import DsaTracker from './components/DsaTracker';
import LldTracker from './components/LldTracker';
import HldTracker from './components/HldTracker';
import ConcurrencyTracker from './components/ConcurrencyTracker';
import Notes from './components/Notes';
import { dsaTopics } from './data/dsaTopics';
import { lldTopics } from './data/lldTopics';
import { hldTopics } from './data/hldTopics';
import { concurrencyTopics } from './data/concurrencyTopics';
import { useWorkspace } from './hooks/useWorkspace';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { theme, setTheme, storageError } = useTheme();
  const {
    saving,
    error: workspaceError,
    retry,
    importNotice,
    importPending,
  } = useWorkspace();

  const docId = 'my-personal-tracker';

  const [dsa, setDsa, dsaLoading, dsaSyncError] = useCloudStorage(
    'dsa_progress',
    docId,
    dsaTopics,
    'faang-tracker-dsa-v10',
    'faang-tracker-dsa-v9',
  );
  const [lld, setLld, lldLoading] = useCloudStorage(
    'lld_progress',
    docId,
    lldTopics,
    'faang-tracker-lld-v8',
  );
  const [hld, setHld, hldLoading] = useCloudStorage(
    'hld_progress',
    docId,
    hldTopics,
    'faang-tracker-hld-v8',
  );
  const [concurrency, setConcurrency, concurrencyLoading] = useCloudStorage(
    'concurrency_progress',
    docId,
    concurrencyTopics,
    'faang-tracker-concurrency-v1',
  );
  const [notes, setNotes, notesLoading, notesSyncError, notesStorageError] =
    useCloudNotes(docId);

  const isLoading =
    dsaLoading ||
    lldLoading ||
    hldLoading ||
    concurrencyLoading ||
    notesLoading;

  const resetProgress = async () => {
    if (window.confirm('Reset ALL progress? This cannot be undone.')) {
      await Promise.all([
        setDsa(dsaTopics),
        setLld(lldTopics),
        setHld(hldTopics),
        setConcurrency(concurrencyTopics),
      ]);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: ListTodo },
    { id: 'homework', label: 'Homework', icon: LayoutDashboard },
    { id: 'important', label: 'Important links', icon: Bookmark },
    { id: 'dsa', label: 'DSA', icon: BookOpen },
    { id: 'lld', label: 'LLD', icon: Layers },
    { id: 'hld', label: 'HLD', icon: Monitor },
    { id: 'concurrency', label: 'Concurrency', icon: Lock },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  return (
    <div className="app-shell min-h-screen bg-canvas font-sans text-ink">
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 button-primary"
      >
        Skip to content
      </a>
      <header className="app-header sticky top-0 z-20 border-b border-line bg-header">
        <div className="header-inner">
          <div className="brand-row">
            <div className="brand-lockup">
              <span className="brand-mark">
                <PanelsTopLeft size={19} strokeWidth={1.6} />
              </span>
              <div>
                <p className="brand-name">
                  My Space<span className="text-accent">.</span>
                </p>
                <p className="brand-caption">A place for your everyday.</p>
              </div>
            </div>
            <div className="header-tools">
              <ThemeSwitcher
                theme={theme}
                onChange={setTheme}
                syncError={
                  workspaceError ||
                  (storageError ? 'Appearance could not be saved.' : '')
                }
              />
              <span
                role="status"
                className="header-utility"
                title={
                  workspaceError
                    ? 'Changes need attention'
                    : saving
                      ? 'Saving to Firebase'
                      : 'Synced with Firebase'
                }
              >
                {workspaceError ? (
                  <CloudOff size={17} className="text-danger" />
                ) : saving ? (
                  <LoaderCircle size={17} className="animate-spin text-muted" />
                ) : (
                  <Cloud size={17} className="text-accent" />
                )}
                <span className="sr-only">
                  {workspaceError
                    ? 'Unable to sync'
                    : saving
                      ? 'Saving to Firebase'
                      : 'Synced with Firebase'}
                </span>
              </span>
              <details className="workspace-menu">
                <summary
                  aria-label="Workspace options"
                  title="Workspace options"
                  className="header-utility"
                >
                  <MoreHorizontal size={19} />
                </summary>
                <div className="panel workspace-menu-content">
                  <p className="eyebrow px-3 pt-2 mb-2">Workspace</p>
                  <p className="break-all px-3 pb-2 text-xs text-muted">
                    Shared workspace · Firebase
                  </p>
                  <a
                    href="https://github.com/authenticcoder1997/faang-tracker"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitBranch size={15} />
                    View source
                  </a>
                  <button onClick={resetProgress}>
                    <RefreshCw size={15} />
                    Reset study progress
                  </button>
                </div>
              </details>
            </div>
          </div>
          <nav aria-label="Main navigation" className="navigation-strip">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className="navigation-tab"
              >
                <Icon size={16} strokeWidth={1.7} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="workspace" className="min-w-0">
        {workspaceError && (
          <div
            role="alert"
            className="mx-3 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger/5 p-4 text-sm text-danger sm:mx-6"
          >
            <p>{workspaceError}</p>
            <button type="button" className="button-secondary" onClick={retry}>
              Retry saving
            </button>
          </div>
        )}
        {importNotice && (
          <div role="status" className="flex flex-wrap items-center gap-3 px-3 pt-4 text-xs text-muted sm:px-6">
            <p>{importNotice}</p>
            {importPending && (
              <button type="button" className="button-secondary" onClick={retry}>
                Retry connection
              </button>
            )}
          </div>
        )}
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <TaskHome
            isActive={activeTab === 'dashboard'}
            onOpenHomework={() => setActiveTab('homework')}
          />
        </div>
        <div className={activeTab === 'important' ? 'block' : 'hidden'}>
          <ImportantLinks isActive={activeTab === 'important'} />
        </div>
        {isLoading && !['dashboard', 'important'].includes(activeTab) ? (
          <div
            className="flex min-h-[60vh] items-center justify-center"
            role="status"
            aria-label="Loading study progress"
          >
            <RefreshCw className="animate-spin text-accent" size={28} />
          </div>
        ) : (
          <>
            <div className={activeTab === 'homework' ? 'block' : 'hidden'}>
              <DailyHome
                dsa={dsa}
                lld={lld}
                hld={hld}
                concurrency={concurrency}
                setDsa={setDsa}
                setLld={setLld}
                setHld={setHld}
                setConcurrency={setConcurrency}
                setActiveTab={setActiveTab}
              />
            </div>
            <div className={activeTab === 'dsa' ? 'block' : 'hidden'}>
              <DsaTracker
                items={dsa}
                setItems={setDsa}
                savingLocally={!!dsaSyncError}
              />
            </div>
            <div className={activeTab === 'lld' ? 'block' : 'hidden'}>
              <LldTracker items={lld} setItems={setLld} />
            </div>
            <div className={activeTab === 'hld' ? 'block' : 'hidden'}>
              <HldTracker items={hld} setItems={setHld} />
            </div>
            <div className={activeTab === 'concurrency' ? 'block' : 'hidden'}>
              <ConcurrencyTracker
                items={concurrency}
                setItems={setConcurrency}
              />
            </div>
            <div className={activeTab === 'notes' ? 'block h-full' : 'hidden'}>
              <Notes
                notes={notes}
                setNotes={setNotes}
                syncError={notesSyncError}
                storageError={notesStorageError}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
