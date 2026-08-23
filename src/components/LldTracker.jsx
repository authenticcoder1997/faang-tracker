import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, PlayCircle, History, Gamepad2, Search, Database, Settings2, AppWindow, Network, MessageSquare, CreditCard, ShoppingCart, Wrench, CheckCircle2, Circle, FileText } from 'lucide-react';
import NoteModal from './NoteModal';

export default function LldTracker({ items, setItems }) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [patternFilter, setPatternFilter] = useState('All');
  const [activeNoteItem, setActiveNoteItem] = useState(null);

  const toggleItem = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const allPatternsRaw = items.flatMap(i => (i.pattern || '').split(',').map(p => p.trim())).filter(Boolean);
  const uniquePatterns = [...new Set(allPatternsRaw)].sort();

  // Filter items by search, difficulty, priority, and pattern
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || item.difficulty === difficultyFilter;
    const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;
    const matchesPattern = patternFilter === 'All' || (item.pattern && item.pattern.includes(patternFilter));
    return matchesSearch && matchesDifficulty && matchesPriority && matchesPattern;
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
  const total = items.length;
  const completed = items.filter(i => i.completed).length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const easyTotal = items.filter(i => i.difficulty === 'Easy').length;
  const easyDone = items.filter(i => i.difficulty === 'Easy' && i.completed).length;
  const medTotal = items.filter(i => i.difficulty === 'Medium').length;
  const medDone = items.filter(i => i.difficulty === 'Medium' && i.completed).length;
  const hardTotal = items.filter(i => i.difficulty === 'Hard').length;
  const hardDone = items.filter(i => i.difficulty === 'Hard' && i.completed).length;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-gray-300 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Low Level Design Practice</h1>
            <p className="text-gray-400 text-sm mb-4">Practice for Low Level Design Interviews step-by-step with AI powered evaluation and feedback</p>
            <a href="https://algomaster.io/interview/low-level-design" target="_blank" rel="noopener noreferrer" className="text-[#22c55e] text-sm font-medium hover:underline flex items-center gap-1">How it Works ↓</a>
          </div>
          
          <div className="flex items-center gap-6 bg-[#171717] p-4 rounded-xl border border-gray-800">
            <div className="relative w-20 h-20 rounded-full bg-[#262626] flex items-center justify-center border-4 border-[#262626]">
              <div className="absolute inset-0 rounded-full border-4 border-[#22c55e]" style={{ clipPath: `inset(${100 - pct}% 0 0 0)` }}></div>
              <div className="text-center z-10">
                <div className="text-lg font-bold text-white leading-none">{completed}/{total}</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-[#22c55e] text-xs mb-1">Easy</div>
                <div className="text-white font-bold">{easyDone}<span className="text-gray-500 text-sm">/{easyTotal}</span></div>
              </div>
              <div className="text-center">
                <div className="text-[#eab308] text-xs mb-1">Medium</div>
                <div className="text-white font-bold">{medDone}<span className="text-gray-500 text-sm">/{medTotal}</span></div>
              </div>
              <div className="text-center">
                <div className="text-[#ef4444] text-xs mb-1">Hard</div>
                <div className="text-white font-bold">{hardDone}<span className="text-gray-500 text-sm">/{hardTotal}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <div className="flex gap-4 items-center text-sm text-gray-400">
            <span>📁 {sections.length} sections</span>
            <span>📄 {items.length} problems</span>
            <span className="text-[#22c55e]">✓ {completed} completed</span>
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
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Pattern:</span>
              <select 
                value={patternFilter}
                onChange={(e) => setPatternFilter(e.target.value)}
                className="bg-[#171717] border border-gray-800 rounded-md py-2 px-3 text-white focus:outline-none focus:border-[#22c55e] max-w-[150px] truncate"
              >
                <option>All</option>
                {uniquePatterns.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Priority:</span>
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-[#171717] border border-gray-800 rounded-md py-2 px-3 text-white focus:outline-none focus:border-[#22c55e]"
              >
                <option>All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
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
        </div>

        {/* Table structure */}
        <div className="w-full rounded-t-md overflow-hidden border border-gray-800">
          {/* Header Row */}
          <div className="grid grid-cols-12 bg-[#22c55e] text-black font-semibold text-sm py-2 px-4 items-center">
            <div className="col-span-1">Date</div>
            <div className="col-span-3">Problem</div>
            <div className="col-span-2 text-center">Notes</div>
            <div className="col-span-2">Pattern</div>
            <div className="col-span-2 text-center">Priority</div>
            <div className="col-span-1 text-center">Difficulty</div>
            <div className="col-span-1 text-center">Solved</div>
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
                      <div className="col-span-1 text-xs text-gray-500 whitespace-nowrap">{item.date}</div>
                      <div className="col-span-3 flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-xs">&lt;/&gt;</span>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#22c55e] hover:underline underline-offset-2 text-sm transition-colors line-clamp-2">
                          {item.title}
                        </a>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveNoteItem(item); }}
                          className={`p-1.5 rounded transition-colors ${item.note ? 'text-[#22c55e] hover:bg-[#22c55e]/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                          title={item.note ? "Edit Notes" : "Add Notes"}
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                      <div className="col-span-2 text-xs text-gray-400 font-medium">
                        {item.pattern || '-'}
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
                      <div className="col-span-1 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.difficulty === 'Easy' ? 'text-[#22c55e]' : 
                          item.difficulty === 'Medium' ? 'text-[#eab308]' : 
                          'text-[#ef4444]'
                        }`}>
                          {item.difficulty}
                        </span>
                      </div>
                      {/* Solved Checkbox */}
                      <div className="col-span-1 flex justify-center cursor-pointer" onClick={() => toggleItem(item.id)}>
                        {item.completed ? (
                          <CheckCircle2 size={20} className="text-[#22c55e]" />
                        ) : (
                          <Circle size={20} className="text-gray-500 hover:text-[#22c55e] transition-colors" />
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
      <NoteModal 
        isOpen={!!activeNoteItem}
        onClose={() => setActiveNoteItem(null)}
        initialNote={activeNoteItem?.note}
        problemTitle={activeNoteItem?.title}
        onSave={(newNote) => {
          if (activeNoteItem && activeNoteItem.note !== newNote) {
            setItems(items.map(i => i.id === activeNoteItem.id ? { ...i, note: newNote } : i));
          }
        }}
      />
    </div>
  );
}