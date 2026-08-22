import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Layers, Monitor, Moon, Sun, RefreshCw, Github, ChevronDown, ChevronUp, ExternalLink, Check } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Dashboard from './components/Dashboard';
import { dsaTopics } from './data/dsaTopics';
import { lldTopics } from './data/lldTopics';
import { hldTopics } from './data/hldTopics';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true); // Default dark

  const mergeData = (stored, defaults) => {
    if (!stored || stored.length === 0) return defaults;
    const merged = stored.map(item => {
      const defaultItem = defaults.find(d => d.id === item.id);
      if (defaultItem && (!item.url || item.title !== defaultItem.title)) {
        return { ...item, url: defaultItem.url, title: defaultItem.title, difficulty: defaultItem.difficulty };
      }
      return item;
    });
    defaults.forEach(defaultItem => {
      if (!merged.find(m => m.id === defaultItem.id)) {
        merged.push({ ...defaultItem });
      }
    });
    return merged;
  };

  const [storedDsa, setDsa] = useLocalStorage('faang-tracker-dsa-v2', dsaTopics);
  const [storedLld, setLld] = useLocalStorage('faang-tracker-lld-v2', lldTopics);
  const [storedHld, setHld] = useLocalStorage('faang-tracker-hld-v2', hldTopics);

  const dsa = mergeData(storedDsa, dsaTopics);
  const lld = mergeData(storedLld, lldTopics);
  const hld = mergeData(storedHld, hldTopics);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const resetProgress = () => {
    if (window.confirm('Reset ALL progress? This cannot be undone.')) {
      setDsa(dsaTopics);
      setLld(lldTopics);
      setHld(hldTopics);
      window.location.reload();
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'dsa', label: 'DSA Roadmap', icon: <BookOpen size={18} />, items: dsa, setItems: setDsa },
    { id: 'lld', label: 'LLD Practice', icon: <Layers size={18} />, items: lld, setItems: setLld },
    { id: 'hld', label: 'System Design', icon: <Monitor size={18} />, items: hld, setItems: setHld },
  ];

  return (
    <div className="min-h-screen bg-gray-950 dark:bg-gray-950 text-gray-100 flex flex-col md:flex-row transition-colors">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 border-r border-gray-800 md:fixed md:h-full flex flex-col z-20">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-xl font-black text-green-400 tracking-tight">⚡ FAANG Tracker</h1>
          <p className="text-xs text-gray-500 mt-1">Crack Google, Meta, Amazon</p>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-left ${
                activeTab === tab.id
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-green-400' : 'text-gray-500'}>{tab.icon}</span>
              {tab.label}
              {tab.items && (
                <span className="ml-auto text-xs text-gray-500 font-mono">
                  {tab.items.filter(i => i.completed).length}/{tab.items.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={resetProgress}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <RefreshCw size={16} />
            Reset Progress
          </button>
          <a
            href="https://github.com/authenticcoder1997/faang-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            <Github size={16} />
            View Source
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen bg-gray-950">
        {activeTab === 'dashboard' ? (
          <Dashboard dsa={dsa} lld={lld} hld={hld} setActiveTab={setActiveTab} />
        ) : (
          <ProblemTable
            tab={tabs.find(t => t.id === activeTab)}
            setItems={tabs.find(t => t.id === activeTab)?.setItems}
          />
        )}
      </main>
    </div>
  );
}

function DifficultyBadge({ difficulty }) {
  const colors = {
    Easy: 'text-green-400',
    Medium: 'text-yellow-400',
    Hard: 'text-red-400',
  };
  return (
    <span className={`text-sm font-semibold ${colors[difficulty] || 'text-gray-400'}`}>
      {difficulty}
    </span>
  );
}

function ProblemTable({ tab, setItems }) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  if (!tab) return null;

  const toggleItem = (id) => {
    setItems(tab.items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const addItem = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setItems([...tab.items, {
      id: Date.now().toString(),
      title: newTitle.trim(),
      url: newUrl.trim() || null,
      difficulty: 'Medium',
      completed: false,
    }]);
    setNewTitle('');
    setNewUrl('');
  };

  // Group by difficulty
  const groups = [
    { label: 'Easy', items: tab.items.filter(i => i.difficulty === 'Easy') },
    { label: 'Medium', items: tab.items.filter(i => i.difficulty === 'Medium') },
    { label: 'Hard', items: tab.items.filter(i => i.difficulty === 'Hard') },
    { label: 'Other', items: tab.items.filter(i => !['Easy','Medium','Hard'].includes(i.difficulty)) },
  ].filter(g => g.items.length > 0);

  const completed = tab.items.filter(i => i.completed).length;
  const total = tab.items.length;

  const sectionColors = {
    Easy: 'text-green-400 border-green-500/30 bg-green-500/10',
    Medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    Hard: 'text-red-400 border-red-500/30 bg-red-500/10',
    Other: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-1">{tab.label}</h2>
        <p className="text-gray-400 text-sm mb-4">Track your progress. Consistency is the key to cracking FAANG.</p>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-800 rounded-full h-2 max-w-xs">
            <div
              className="bg-green-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (completed/total)*100 : 0}%` }}
            />
          </div>
          <span className="text-sm text-gray-400 font-mono">{completed}/{total} completed</span>
          {['Easy','Medium','Hard'].map(diff => {
            const g = groups.find(gr => gr.label === diff);
            if (!g) return null;
            const doneCount = g.items.filter(i => i.completed).length;
            return (
              <span key={diff} className="text-xs font-semibold">
                <DifficultyBadge difficulty={diff} /> <span className="text-gray-500 font-mono">{doneCount}/{g.items.length}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Add custom item */}
      <form onSubmit={addItem} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Add custom problem..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
        />
        <input
          type="url"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          placeholder="URL (optional)"
          className="w-48 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg text-sm transition-colors"
        >
          + Add
        </button>
      </form>

      {/* Problem table */}
      <div className="space-y-4">
        {groups.map((group, gi) => {
          const isCollapsed = collapsedSections[group.label];
          const doneCount = group.items.filter(i => i.completed).length;
          return (
            <div key={group.label} className="rounded-xl border border-gray-800 overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => setCollapsedSections(prev => ({ ...prev, [group.label]: !isCollapsed }))}
                className="w-full flex items-center gap-3 px-5 py-3 bg-gray-900 hover:bg-gray-800/80 transition-colors"
              >
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${sectionColors[group.label]}`}>
                  {group.label}
                </span>
                <span className="text-sm font-semibold text-gray-200">{group.label} Problems</span>
                <span className="text-xs text-gray-500 font-mono">({group.items.length} problems)</span>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500">{doneCount}/{group.items.length}</span>
                  {isCollapsed ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
                </div>
              </button>

              {/* Table */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-5 py-2 text-left w-8">#</th>
                        <th className="px-5 py-2 text-left">Problem</th>
                        <th className="px-5 py-2 text-left w-24">Difficulty</th>
                        <th className="px-5 py-2 text-center w-28">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`border-b border-gray-800/50 transition-colors hover:bg-gray-800/40 ${
                            item.completed ? 'bg-green-500/5' : ''
                          }`}
                        >
                          <td className="px-5 py-3 text-gray-600 font-mono text-xs">{idx + 1}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`font-medium hover:text-green-400 transition-colors flex items-center gap-1.5 ${
                                    item.completed ? 'line-through text-gray-500' : 'text-gray-200'
                                  }`}
                                >
                                  {item.title}
                                  <ExternalLink size={12} className="text-gray-600 flex-shrink-0" />
                                </a>
                              ) : (
                                <span className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                  {item.title}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <DifficultyBadge difficulty={item.difficulty} />
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => toggleItem(item.id)}
                              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all border ${
                                item.completed
                                  ? 'bg-green-500/20 border-green-500/40 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                                  : 'bg-transparent border-gray-600 text-gray-400 hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-400'
                              }`}
                            >
                              {item.completed ? (
                                <span className="flex items-center gap-1"><Check size={12} /> Done</span>
                              ) : '▶ Start'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
