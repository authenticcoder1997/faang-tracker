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
} from 'lucide-react';
import { useCloudStorage } from './hooks/useCloudStorage';
import { useCloudNotes } from './hooks/useCloudNotes';
import DailyHome from './components/DailyHome';
import TaskHome from './components/TaskHome';
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

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { theme, setTheme, storageError } = useTheme();

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
      window.location.reload();
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: ListTodo },
    { id: 'homework', label: 'Homework', icon: LayoutDashboard },
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
                storageError={storageError}
              />
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
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <TaskHome
            isActive={activeTab === 'dashboard'}
            onOpenHomework={() => setActiveTab('homework')}
          />
        </div>
        {isLoading && activeTab !== 'dashboard' ? (
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
