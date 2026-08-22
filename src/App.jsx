import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Layers, Monitor, Moon, Sun, Github, RefreshCw } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Dashboard from './components/Dashboard';
import TrackerList from './components/TrackerList';
import { dsaTopics } from './data/dsaTopics';
import { lldTopics } from './data/lldTopics';
import { hldTopics } from './data/hldTopics';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Merge new properties (like URL) from default data to existing local storage data
  const mergeData = (stored, defaults) => {
    if (!stored || stored.length === 0) return defaults;
    
    // Add missing items or update URLs for existing ones
    const merged = stored.map(item => {
      const defaultItem = defaults.find(d => d.id === item.id);
      if (defaultItem && (!item.url || item.title !== defaultItem.title)) {
        return { ...item, url: defaultItem.url, title: defaultItem.title };
      }
      return item;
    });
    
    // Add new items from defaults that aren't in stored
    defaults.forEach(defaultItem => {
      if (!merged.find(m => m.id === defaultItem.id)) {
        merged.push(defaultItem);
      }
    });
    
    return merged;
  };

  const [storedDsa, setDsa] = useLocalStorage('faang-tracker-dsa', dsaTopics);
  const [storedLld, setLld] = useLocalStorage('faang-tracker-lld', lldTopics);
  const [storedHld, setHld] = useLocalStorage('faang-tracker-hld', hldTopics);
  
  const dsa = mergeData(storedDsa, dsaTopics);
  const lld = mergeData(storedLld, lldTopics);
  const hld = mergeData(storedHld, hldTopics);

  useEffect(() => {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'dsa', label: 'DSA Roadmap', icon: <BookOpen size={20} /> },
    { id: 'lld', label: 'LLD Practice', icon: <Layers size={20} /> },
    { id: 'hld', label: 'System Design', icon: <Monitor size={20} /> },
  ];

  const resetProgress = () => {
    if (window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
      setDsa(dsaTopics);
      setLld(lldTopics);
      setHld(hldTopics);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 md:fixed h-auto md:h-full flex flex-col z-20 transition-colors">
        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
            FAANG Tracker
          </h1>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors md:hidden"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        
        <nav className="p-4 md:p-6 space-y-2 flex-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-semibold text-left ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700/50 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-white' : 'text-gray-400 dark:text-gray-500'}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-4">
          <button 
            onClick={resetProgress}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors w-full"
          >
            <RefreshCw size={16} />
            Reset Progress
          </button>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
              Crack FAANG! 🚀
            </span>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="hidden md:flex p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-6 md:p-10 w-full overflow-x-hidden">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 dark:text-white tracking-tight">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
              Consistency is key. Keep up the good work!
            </p>
          </div>
          <a 
            href="https://github.com/authenticcoder1997/faang-tracker" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors w-fit"
          >
            <Github size={20} />
            View Source
          </a>
        </header>

        <div className="max-w-5xl mx-auto md:mx-0 pb-20 md:pb-0">
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
