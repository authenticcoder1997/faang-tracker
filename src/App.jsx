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
  const [notes, setNotes, notesLoading] = useCloudNotes(docId);

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
    {
      id: 'dashboard',
      label: 'Home',
      icon: <ListTodo size={18} />,
      accent: 'text-blue-400',
      bar: 'bg-blue-400',
    },
    {
      id: 'homework',
      label: 'Homework',
      icon: <LayoutDashboard size={18} />,
      accent: 'text-green-400',
      bar: 'bg-green-400',
    },
    {
      id: 'dsa',
      label: 'DSA',
      icon: <BookOpen size={18} />,
      accent: 'text-green-400',
      bar: 'bg-green-500',
    },
    {
      id: 'lld',
      label: 'LLD',
      icon: <Layers size={18} />,
      accent: 'text-emerald-400',
      bar: 'bg-emerald-500',
    },
    {
      id: 'hld',
      label: 'HLD',
      icon: <Monitor size={18} />,
      accent: 'text-teal-400',
      bar: 'bg-teal-500',
    },
    {
      id: 'concurrency',
      label: 'Concurrency',
      icon: <Lock size={18} />,
      accent: 'text-violet-400',
      bar: 'bg-violet-500',
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: <FileText size={18} />,
      accent: 'text-amber-400',
      bar: 'bg-amber-500',
    },
  ];

  return (
    <div className="app-shell min-h-screen bg-canvas font-sans text-ink">
      <header className="app-header sticky top-0 z-20 border-b border-line bg-header backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 px-4 sm:gap-x-6 lg:gap-x-8 sm:px-6 lg:px-10">
          <div className="py-4 lg:py-5">
            <p className="text-base font-bold tracking-tight text-ink">
              My Space
            </p>
            <p className="mt-0.5 hidden text-[11px] text-muted sm:block">
              Your everyday workspace
            </p>
          </div>
          <nav
            aria-label="Main navigation"
            className="order-3 flex w-full min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden 2xl:order-2 2xl:w-auto 2xl:flex-1"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`relative flex shrink-0 items-center gap-2 px-3 py-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-blue-400 2xl:py-7 ${
                  activeTab === tab.id
                    ? 'text-ink'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <span
                  className={activeTab === tab.id ? tab.accent : 'text-faint'}
                >
                  {tab.icon}
                </span>
                {tab.label}
                {activeTab === tab.id && (
                  <span
                    className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full ${tab.bar}`}
                  />
                )}
              </button>
            ))}
          </nav>
          <div className="order-2 ml-auto flex items-center gap-1 2xl:order-3">
            <ThemeSwitcher
              theme={theme}
              onChange={setTheme}
              storageError={storageError}
            />
            <a
              href="https://github.com/authenticcoder1997/faang-tracker"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Source"
              title="View source"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted hover:bg-hover hover:text-ink"
            >
              <GitBranch size={15} />
              <span className="hidden sm:inline">Source</span>
            </a>
            <button
              onClick={resetProgress}
              aria-label="Reset Progress"
              title="Reset study progress"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted hover:bg-hover hover:text-red-400"
            >
              <RefreshCw size={15} />
              <span className="hidden sm:inline">Reset progress</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-w-0">
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <TaskHome onOpenHomework={() => setActiveTab('homework')} />
        </div>
        {isLoading && activeTab !== 'dashboard' ? (
          <div
            className="flex min-h-[60vh] items-center justify-center"
            role="status"
            aria-label="Loading study progress"
          >
            <RefreshCw className="animate-spin text-green-400" size={28} />
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
              <Notes notes={notes} setNotes={setNotes} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
