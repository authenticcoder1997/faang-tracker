import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, PlayCircle, History, Gamepad2, Search, Database, Settings2, AppWindow, Network, MessageSquare, CreditCard, ShoppingCart, Wrench } from 'lucide-react';

export default function LldTracker({ items, setItems }) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  const toggleItem = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  // Filter items by search and difficulty
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || item.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const sections = Array.from(new Set(items.map(i => i.section)));
  const allCollapsed = sections.every(s => collapsedSections[s]);
  
  const toggleAllSections = () => {
    const newState = {};
    sections.forEach(s => { newState[s] = !allCollapsed; });
    setCollapsedSections(newState);
  };

  const getSectionIcon = (section) => {
    switch(section) {
      case 'Games & Puzzles': return <Gamepad2 size={16} className="text-[#22c55e]" />;
      case 'Data Structures & Search': return <Database size={16} className="text-[#22c55e]" />;
      case 'Managing States': return <Settings2 size={16} className="text-[#22c55e]" />;
      case 'Management Systems': return <AppWindow size={16} className="text-[#22c55e]" />;
      case 'Social & Content Platforms': return <Network size={16} className="text-[#22c55e]" />;
      case 'Communication & Messaging': return <MessageSquare size={16} className="text-[#22c55e]" />;
      case 'Financial & Payment Systems': return <CreditCard size={16} className="text-[#22c55e]" />;
      case 'E-commerce & Booking Systems': return <ShoppingCart size={16} className="text-[#22c55e]" />;
      case 'Developer Tools & Infrastructure': return <Wrench size={16} className="text-[#22c55e]" />;
      default: return <Gamepad2 size={16} className="text-[#22c55e]" />;
    }
  };

  // Count completed
  const completedCount = items.filter(i => i.completed).length;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-gray-300 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Low Level Design Practice</h1>
          <p className="text-gray-400 text-sm mb-4">Practice for Low Level Design Interviews step-by-step with AI powered evaluation and feedback</p>
          <a href="https://algomaster.io/interview/low-level-design" target="_blank" rel="noopener noreferrer" className="text-[#22c55e] text-sm font-medium hover:underline flex items-center gap-1">How it Works ↓</a>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <div className="flex gap-4 items-center text-sm text-gray-400">
            <span>📁 {sections.length} sections</span>
            <span>📄 {items.length} problems</span>
            <span className="text-[#22c55e]">✓ {completedCount} completed</span>
          </div>
          <button 
            onClick={toggleAllSections}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
          >
            {allCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search problems..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171717] border border-gray-800 rounded-md py-2 pl-9 pr-4 text-sm text-gray-200 focus:outline-none focus:border-[#22c55e]"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Access:</span>
            <select className="bg-[#171717] border border-gray-800 rounded-md py-2 px-3 text-white focus:outline-none focus:border-[#22c55e]">
              <option>All Problems</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Difficulty:</span>
            <select 
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-[#171717] border border-gray-800 rounded-md py-2 px-3 text-white focus:outline-none focus:border-[#22c55e]"
            >
              <option>All</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
        </div>

        {/* Table structure */}
        <div className="w-full rounded-t-md overflow-hidden border border-gray-800">
          {/* Header Row */}
          <div className="grid grid-cols-12 bg-[#22c55e] text-black font-semibold text-sm py-2 px-4 items-center">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Section / Problem</div>
            <div className="col-span-1 text-center">Difficulty</div>
            <div className="col-span-1 text-center">Learn</div>
            <div className="col-span-1 text-center">Simulation</div>
            <div className="col-span-2 text-center">Action</div>
            <div className="col-span-2 text-center">History</div>
          </div>

          {/* Sections */}
          <div className="bg-[#0f0f0f]">
            {sections.map((section, sIdx) => {
              const sectionItems = filteredItems.filter(i => i.section === section);
              const isCollapsed = collapsedSections[section];
              const allSectionItems = items.filter(i => i.section === section);
              const sectionCompleted = allSectionItems.filter(i => i.completed).length;

              // Skip sections with no matching items when filtering
              if (searchQuery && sectionItems.length === 0) return null;

              return (
                <div key={section}>
                  {/* Section Header */}
                  <div 
                    className="grid grid-cols-12 bg-[#1e293b] text-gray-200 py-3 px-4 items-center cursor-pointer border-b border-gray-800/50 hover:bg-[#253347] transition-colors"
                    onClick={() => setCollapsedSections(prev => ({...prev, [section]: !isCollapsed}))}
                  >
                    <div className="col-span-1 text-sm text-gray-400">{sIdx + 1}</div>
                    <div className="col-span-11 flex items-center gap-2 text-sm font-semibold">
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      {getSectionIcon(section)}
                      <span className="text-white">{section}</span>
                      <span className="text-gray-500 font-normal text-xs ml-2">
                        ({sectionCompleted}/{allSectionItems.length} completed)
                      </span>
                    </div>
                  </div>

                  {/* Section Rows */}
                  {!isCollapsed && sectionItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors">
                      <div className="col-span-1"></div>
                      <div className="col-span-4 flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-xs">&lt;/&gt;</span>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#22c55e] hover:underline underline-offset-2 text-sm transition-colors">
                          {item.title}
                        </a>
                        {item.completed && <span className="bg-[#22c55e]/20 text-[#22c55e] text-[10px] px-2 py-0.5 rounded-full font-medium">In Progress</span>}
                      </div>
                      <div className="col-span-1 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.difficulty === 'Easy' ? 'text-[#22c55e]' : 
                          item.difficulty === 'Medium' ? 'text-[#eab308]' : 
                          'text-[#ef4444]'
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>
                      {/* Learn - links to the article on Algomaster */}
                      <div className="col-span-1 flex justify-center">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          aria-label={`Read the ${item.title} article`}
                          className="p-1 rounded-md hover:bg-gray-800 transition-colors"
                        >
                          <BookOpen size={16} className="text-gray-400 hover:text-white cursor-pointer" />
                        </a>
                      </div>
                      {/* Simulation - opens the article page with code walkthrough & animations */}
                      <div className="col-span-1 flex justify-center">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          aria-label={`${item.title} simulation`}
                          className="p-1 rounded-md hover:bg-gray-800 transition-colors"
                        >
                          <PlayCircle size={16} className="text-gray-400 hover:text-white cursor-pointer" />
                        </a>
                      </div>
                      {/* Action - opens AI-powered practice session on Algomaster */}
                      <div className="col-span-2 flex justify-center">
                        <a
                          href={`https://algomaster.io/interview/low-level-design`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => { if (!item.completed) toggleItem(item.id); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer no-underline ${
                            item.completed 
                              ? 'bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 border border-[#22c55e]/30' 
                              : 'bg-[#22c55e] text-black hover:bg-[#4ade80]'
                          }`}
                        >
                          {item.completed ? '+ New' : '▶ Start'}
                        </a>
                      </div>
                      {/* History */}
                      <div className="col-span-2 flex justify-center">
                        {item.completed ? (
                          <button 
                            onClick={() => toggleItem(item.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06b6d4] text-black rounded-md text-xs font-semibold hover:bg-[#22d3ee] transition-colors"
                          >
                            <History size={12} /> History
                          </button>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
