import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, PlayCircle, History, Gamepad2, Search, Database, Settings2, AppWindow, Network, MessageSquare, CreditCard, ShoppingCart, Wrench, CheckCircle2, Circle } from 'lucide-react';

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
            <div className="col-span-5">Section / Problem</div>
            <div className="col-span-2 text-center">Priority</div>
            <div className="col-span-2 text-center">Difficulty</div>
            <div className="col-span-2 text-center">Solved</div>
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
                      <div className="col-span-5 flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-xs">&lt;/&gt;</span>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#22c55e] hover:underline underline-offset-2 text-sm transition-colors">
                          {item.title}
                        </a>
                      </div>
                      <div className="col-span-2 text-center flex justify-center">
                        {item.priority ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            item.priority === 'High' 
                              ? 'text-rose-400 border-rose-400/30 bg-rose-400/10' 
                              : item.priority === 'Medium'
                              ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
                              : 'text-green-400 border-green-400/30 bg-green-400/10'
                          }`}>
                            {item.priority}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.difficulty === 'Easy' ? 'text-[#22c55e]' : 
                          item.difficulty === 'Medium' ? 'text-[#eab308]' : 
                          'text-[#ef4444]'
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>
                      {/* Solved Checkbox */}
                      <div className="col-span-2 flex justify-center cursor-pointer" onClick={() => toggleItem(item.id)}>
                        {item.completed ? (
                          <CheckCircle2 size={24} className="text-[#22c55e]" />
                        ) : (
                          <Circle size={24} className="text-gray-500 hover:text-[#22c55e] transition-colors" />
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
