import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Layers, Monitor, RefreshCw, GitBranch, FileText, Lock } from 'lucide-react';
import { useCloudStorage } from './hooks/useCloudStorage';
import { useCloudNotes } from './hooks/useCloudNotes';
import DailyHome from './components/DailyHome';
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

  const docId = "my-personal-tracker";

  const [dsa, setDsa, dsaLoading] = useCloudStorage('dsa_progress', docId, dsaTopics, 'faang-tracker-dsa-v9');
  const [lld, setLld, lldLoading] = useCloudStorage('lld_progress', docId, lldTopics, 'faang-tracker-lld-v8');
  const [hld, setHld, hldLoading] = useCloudStorage('hld_progress', docId, hldTopics, 'faang-tracker-hld-v8');
  const [concurrency, setConcurrency, concurrencyLoading] = useCloudStorage('concurrency_progress', docId, concurrencyTopics, 'faang-tracker-concurrency-v1');
  const [notes, setNotes, notesLoading] = useCloudNotes(docId);

  const isLoading = dsaLoading || lldLoading || hldLoading || concurrencyLoading || notesLoading;

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const resetProgress = async () => {
    if (window.confirm('Reset ALL progress? This cannot be undone.')) {
      await Promise.all([
        setDsa(dsaTopics),
        setLld(lldTopics),
        setHld(hldTopics),
        setConcurrency(concurrencyTopics)
      ]);
      window.location.reload();
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={18} />, accent: 'text-gray-100', bar: 'bg-gray-400' },
    { id: 'dsa', label: 'DSA', icon: <BookOpen size={18} />, accent: 'text-green-400', bar: 'bg-green-500' },
    { id: 'lld', label: 'LLD', icon: <Layers size={18} />, accent: 'text-emerald-400', bar: 'bg-emerald-500' },
    { id: 'hld', label: 'HLD', icon: <Monitor size={18} />, accent: 'text-teal-400', bar: 'bg-teal-500' },
    { id: 'concurrency', label: 'Concurrency', icon: <Lock size={18} />, accent: 'text-violet-400', bar: 'bg-violet-500' },
    { id: 'notes', label: 'Notes', icon: <FileText size={18} />, accent: 'text-amber-400', bar: 'bg-amber-500' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <RefreshCw className="animate-spin text-[#22c55e]" size={32} />
      </div>
    );
  }

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
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium text-left ${
                activeTab === tab.id
                  ? 'bg-[#1c1c1c] text-white border border-[#2a2a2a] shadow-sm'
                  : 'text-gray-400 border border-transparent hover:bg-[#161616] hover:text-gray-200'
              }`}
            >
              {activeTab === tab.id && (
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full ${tab.bar}`} />
              )}
              <span className={activeTab === tab.id ? tab.accent : 'text-gray-500'}>{tab.icon}</span>
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
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          <DailyHome
            dsa={dsa} lld={lld} hld={hld} concurrency={concurrency}
            setDsa={setDsa} setLld={setLld} setHld={setHld} setConcurrency={setConcurrency}
            setActiveTab={setActiveTab}
          />
        </div>
        <div className={activeTab === 'dsa' ? 'block' : 'hidden'}>
          <DsaTracker items={dsa} setItems={setDsa} />
        </div>
        <div className={activeTab === 'lld' ? 'block' : 'hidden'}>
          <LldTracker items={lld} setItems={setLld} />
        </div>
        <div className={activeTab === 'hld' ? 'block' : 'hidden'}>
          <HldTracker items={hld} setItems={setHld} />
        </div>
        <div className={activeTab === 'concurrency' ? 'block' : 'hidden'}>
          <ConcurrencyTracker items={concurrency} setItems={setConcurrency} />
        </div>
        <div className={activeTab === 'notes' ? 'block h-full' : 'hidden'}>
          <Notes notes={notes} setNotes={setNotes} />
        </div>
      </main>
    </div>
  );
}

export default App;
