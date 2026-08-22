import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Layers, Monitor, RefreshCw, GitBranch } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import DailyHome from './components/DailyHome';
import DsaTracker from './components/DsaTracker';
import LldTracker from './components/LldTracker';
import HldTracker from './components/HldTracker';
import { dsaTopics } from './data/dsaTopics';
import { lldTopics } from './data/lldTopics';
import { hldTopics } from './data/hldTopics';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const mergeData = (stored, defaults) => {
    if (!stored || stored.length === 0) return defaults;
    return defaults.map(defaultItem => {
      const currentStored = stored.find(d => d.id === defaultItem.id || d.url === defaultItem.url);
      if (currentStored !== undefined) {
        return { ...defaultItem, completed: currentStored.completed };
      }
      return defaultItem;
    });
  };

  const [dsa, setDsa] = useLocalStorage('faang-tracker-dsa-v7', dsaTopics, mergeData);
  const [lld, setLld] = useLocalStorage('faang-tracker-lld-v7', lldTopics, mergeData);
  const [hld, setHld] = useLocalStorage('faang-tracker-hld-v7', hldTopics, mergeData);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const resetProgress = () => {
    if (window.confirm('Reset ALL progress? This cannot be undone.')) {
      setDsa(dsaTopics);
      setLld(lldTopics);
      setHld(hldTopics);
      window.location.reload();
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Daily Work', icon: <LayoutDashboard size={18} /> },
    { id: 'dsa', label: 'DSA (Planly)', icon: <BookOpen size={18} /> },
    { id: 'lld', label: 'LLD (Algomaster)', icon: <Layers size={18} /> },
    { id: 'hld', label: 'HLD (HelloInterview)', icon: <Monitor size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#111] border-r border-[#222] md:fixed md:h-full flex flex-col z-20">
        <div className="p-6 border-b border-[#222]">
          <h1 className="text-xl font-black text-white tracking-tight">FAANG Tracker</h1>
          <p className="text-xs text-gray-500 mt-1">Crack Google, Meta, Amazon</p>
        </div>

        <nav className="p-3 space-y-1 flex-1 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium text-left ${
                activeTab === tab.id
                  ? 'bg-[#222] text-white border border-[#333]'
                  : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-white' : 'text-gray-500'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#222] space-y-2">
          <button
            onClick={resetProgress}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-[#222] hover:text-red-400 transition-colors"
          >
            <RefreshCw size={16} />
            Reset Progress
          </button>
          <a
            href="https://github.com/authenticcoder1997/faang-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-[#222] hover:text-white transition-colors"
          >
            <GitBranch size={16} />
            View Source
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {activeTab === 'dashboard' && <DailyHome dsa={dsa} lld={lld} hld={hld} setDsa={setDsa} setLld={setLld} setHld={setHld} setActiveTab={setActiveTab} />}
        {activeTab === 'dsa' && <DsaTracker items={dsa} setItems={setDsa} />}
        {activeTab === 'lld' && <LldTracker items={lld} setItems={setLld} />}
        {activeTab === 'hld' && <HldTracker items={hld} setItems={setHld} />}
      </main>
    </div>
  );
}

export default App;
