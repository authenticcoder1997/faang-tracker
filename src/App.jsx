import { Component, memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
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
import TaskHome from './components/TaskHome';
import DailyHome from './components/DailyHome';
import ImportantLinks from './components/ImportantLinks';
import DsaTracker from './components/DsaTracker';
import LldTracker from './components/LldTracker';
import HldTracker from './components/HldTracker';
import ConcurrencyTracker from './components/ConcurrencyTracker';
import Notes from './components/Notes';
import ThemeSwitcher from './components/ThemeSwitcher';
import { useTheme } from './hooks/useTheme';
import { useWorkspace, useWorkspaceValue } from './hooks/useWorkspace';
import { makeResetProgress } from './lib/resetProgress';

// Load the tab code with the workspace so open sessions can outlast a deployment.
const PAGES = {
  dashboard: TaskHome,
  homework: DailyHome,
  important: ImportantLinks,
  dsa: DsaTracker,
  lld: LldTracker,
  hld: HldTracker,
  concurrency: ConcurrencyTracker,
  notes: Notes,
};

class PageErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="page-frame">
        <p role="alert" className="mb-4 text-sm text-muted">This tab couldn’t open.</p>
        <button type="button" className="button-secondary" onClick={() => this.setState({ failed: false })}>
          <RefreshCw size={15} aria-hidden="true" /> Retry tab
        </button>
      </section>
    );
  }
}

const WorkspacePage = memo(function WorkspacePage({ id, active, openTab, openHomework }) {
  const Page = PAGES[id];
  return (
    <div className={active ? 'block' : 'hidden'}>
      <PageErrorBoundary>
        <Page isActive={active} setActiveTab={openTab} onOpenHomework={openHomework} />
      </PageErrorBoundary>
    </div>
  );
});

function WorkspaceSync() {
  const ready = useWorkspaceValue((state) => !!state.data);
  const saving = useWorkspaceValue((state) => state.saving);
  const error = useWorkspaceValue((state) => state.error);
  const status = error ? 'Unable to sync' : saving ? 'Saving to Firebase' : ready ? 'Synced with Firebase' : 'Connecting to Firebase';
  return (
    <span role="status" className="header-utility" title={status}>
      {error ? <CloudOff size={17} className="text-danger" />
        : saving || !ready ? <LoaderCircle size={17} className="animate-spin text-muted" />
          : <Cloud size={17} className="text-accent" />}
      <span className="sr-only">{status}</span>
    </span>
  );
}

function WorkspaceNotices() {
  const { retry } = useWorkspace();
  const ready = useWorkspaceValue((state) => !!state.data);
  const error = useWorkspaceValue((state) => state.error);
  const importNotice = useWorkspaceValue((state) => state.importNotice);
  const importPending = useWorkspaceValue((state) => state.importPending);
  return (
    <>
      {error && (
        <div
          role="alert"
          className="mx-3 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger/5 p-4 text-sm text-danger sm:mx-6"
        >
          <p>{error}</p>
          <button type="button" className="button-secondary" onClick={retry}>
            {ready ? 'Retry sync' : 'Retry connection'}
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
    </>
  );
}

function ConnectingWorkspace() {
  const error = useWorkspaceValue((state) => state.error);
  return (
    <section className="page-frame workspace-placeholder" aria-busy={!error}>
      <p className="eyebrow">Your workspace</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Make room for your day.</h1>
      <p role="status" className="mt-4 flex items-center gap-2 text-sm text-muted">
        {!error && <LoaderCircle size={16} className="animate-spin" />}
        {error ? 'Your workspace will appear here once connected.' : 'Connecting to Firebase…'}
      </p>
      {!error && (
        <div aria-hidden="true" className="mt-10 grid gap-4 border-t border-line pt-7">
          <span className="h-3 w-44 rounded bg-accent-soft" />
          <span className="h-3 w-64 max-w-full rounded bg-accent-soft" />
          <span className="h-3 w-36 rounded bg-accent-soft" />
        </div>
      )}
    </section>
  );
}

function AppearanceControls({ ready }) {
  const { theme, setTheme } = useTheme();
  const error = useWorkspaceValue((state) => state.error);
  return <ThemeSwitcher theme={theme} onChange={setTheme} disabled={!ready} syncError={ready && !!error} />;
}

function App() {
  const [{ activeTab, visited }, setNavigation] = useState({
    activeTab: 'dashboard',
    visited: ['dashboard'],
  });
  const ready = useWorkspaceValue((state) => !!state.data);
  const { updateData } = useWorkspace();
  const currentTab = useRef('dashboard');
  const scrollPositions = useRef(new Map());
  const openTab = useCallback((id) => {
    if (!Object.hasOwn(PAGES, id) || id === currentTab.current) return;
    scrollPositions.current.set(currentTab.current, window.scrollY);
    currentTab.current = id;
    setNavigation((current) => ({
      activeTab: id,
      visited: current.visited.includes(id) ? current.visited : [...current.visited, id],
    }));
  }, []);
  const openHomework = useCallback(() => openTab('homework'), [openTab]);
  useLayoutEffect(() => {
    window.scrollTo({ top: scrollPositions.current.get(activeTab) ?? 0, behavior: 'instant' });
  }, [activeTab]);

  const resetProgress = () => {
    if (!ready || !window.confirm('Reset ALL progress? This cannot be undone.')) return;
    updateData((current) => ({ ...current, progress: makeResetProgress(current.progress) }));
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
              <AppearanceControls ready={ready} />
              <WorkspaceSync />
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
                  <button onClick={resetProgress} disabled={!ready}>
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
                onClick={() => openTab(id)}
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
        <WorkspaceNotices />
        {ready ? visited.map((id) => (
          <WorkspacePage
            key={id}
            id={id}
            active={id === activeTab}
            openTab={openTab}
            openHomework={openHomework}
          />
        )) : <ConnectingWorkspace />}
      </main>
    </div>
  );
}

export default App;
