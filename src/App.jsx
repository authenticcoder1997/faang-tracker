import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Layers, Monitor } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Dashboard from './components/Dashboard';
import TrackerList from './components/TrackerList';
import { dsaTopics } from './data/dsaTopics';
import { lldTopics } from './data/lldTopics';
import { hldTopics } from './data/hldTopics';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [dsa, setDsa] = useLocalStorage('faang-tracker-dsa', dsaTopics);
  const [lld, setLld] = useLocalStorage('faang-tracker-lld', lldTopics);
  const [hld, setHld] = useLocalStorage('faang-tracker-hld', hldTopics);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'dsa', label: 'DSA Roadmap', icon: <BookOpen size={20} /> },
    { id: 'lld', label: 'LLD Practice', icon: <Layers size={20} /> },
    { id: 'hld', label: 'System Design', icon: <Monitor size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            FAANG Tracker
          </h1>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-gray-100 text-sm text-gray-500">
          Crack FAANG! 🚀
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <p className="text-gray-500 mt-2">
            Consistency is key. Keep up the good work!
          </p>
        </header>

        <div className="max-w-5xl">
          {activeTab === 'dashboard' && <Dashboard dsa={dsa} lld={lld} hld={hld} />}
          {activeTab === 'dsa' && <TrackerList title="DSA Concept Revision" items={dsa} setItems={setDsa} />}
          {activeTab === 'lld' && <TrackerList title="LLD Interview Questions" items={lld} setItems={setLld} />}
          {activeTab === 'hld' && <TrackerList title="System Design Problem Breakdowns" items={hld} setItems={setHld} />}
        </div>
      </main>
    </div>
  );
}

export default App;
