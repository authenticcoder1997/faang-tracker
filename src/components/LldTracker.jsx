import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, PlayCircle, History, Gamepad2, Search, Database, Settings2, AppWindow, Network } from 'lucide-react';

export default function LldTracker({ items, setItems }) {
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleItem = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const sections = Array.from(new Set(items.map(i => i.section)));
  
  const getSectionIcon = (section) => {
    switch(section) {
      case 'Games & Puzzles': return <Gamepad2 size={16} className="text-[#22c55e]" />;
      case 'Data Structures & Search': return <Database size={16} className="text-[#22c55e]" />;
      case 'Managing States': return <Settings2 size={16} className="text-[#22c55e]" />;
      case 'Management Systems': return <AppWindow size={16} className="text-[#22c55e]" />;
      case 'Platforms & Networks': return <Network size={16} className="text-[#22c55e]" />;
      default: return <Gamepad2 size={16} className="text-[#22c55e]" />;
    }
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-gray-300 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Low Level Design Practice</h1>
          <p className="text-gray-400 text-sm mb-4">Practice for Low Level Design Interviews step-by-step with AI powered evaluation and feedback</p>
          <a href="#" className="text-[#22c55e] text-sm font-medium hover:underline flex items-center gap-1">How it Works ↓</a>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <div className="flex gap-4 items-center text-sm text-gray-400">
            <span>📁 {sections.length} sections</span>
            <span>📄 {items.length} problems</span>
          </div>
          <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            <ChevronRight size={14} /> Collapse All
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search problems..." 
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
            <select className="bg-[#171717] border border-gray-800 rounded-md py-2 px-3 text-white focus:outline-none focus:border-[#22c55e]">
              <option>All</option>
            </select>
          </div>
        </div>

        {/* Table structure */}
        <div className="w-full rounded-t-md overflow-hidden border border-gray-800">
          {/* Header Row */}
          <div className="grid grid-cols-12 bg-[#22c55e] text-black font-semibold text-sm py-2 px-4 items-center">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Section / Problem</div>
            <div className="col-span-1 text-center">Difficulty</div>
            <div className="col-span-1 text-center">Learn</div>
            <div className="col-span-1 text-center">Simulation</div>
            <div className="col-span-1 text-center">Action</div>
            <div className="col-span-2 text-center">History</div>
          </div>

          {/* Sections */}
          <div className="bg-[#0f0f0f]">
            {sections.map((section, sIdx) => {
              const sectionItems = items.filter(i => i.section === section);
              const isCollapsed = collapsedSections[section];

              return (
                <div key={section}>
                  {/* Section Header */}
                  <div 
                    className="grid grid-cols-12 bg-[#1e293b] text-gray-200 py-3 px-4 items-center cursor-pointer border-b border-gray-800/50"
                    onClick={() => setCollapsedSections(prev => ({...prev, [section]: !isCollapsed}))}
                  >
                    <div className="col-span-1 text-sm text-gray-400">{sIdx + 1}</div>
                    <div className="col-span-11 flex items-center gap-2 text-sm font-semibold">
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      {getSectionIcon(section)}
                      <span className="text-white">{section}</span>
                      <span className="text-gray-500 font-normal text-xs ml-2">({sectionItems.length} problems)</span>
                    </div>
                  </div>

                  {/* Section Rows */}
                  {!isCollapsed && sectionItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors">
                      <div className="col-span-1"></div>
                      <div className="col-span-5 flex items-center gap-3">
                        <span className="text-gray-500 font-mono text-xs">&lt;/&gt;</span>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-sm">
                          {item.title}
                        </a>
                        {item.completed && <span className="bg-[#1e3a8a] text-[#93c5fd] text-[10px] px-2 py-0.5 rounded-full">In Progress</span>}
                      </div>
                      <div className="col-span-1 text-center">
                        <span className={`text-xs font-medium ${item.difficulty === 'Easy' ? 'text-[#22c55e]' : item.difficulty === 'Medium' ? 'text-[#eab308]' : 'text-[#ef4444]'}`}>
                          {item.difficulty}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <BookOpen size={16} className="text-gray-400 cursor-pointer hover:text-white" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <PlayCircle size={16} className="text-gray-400 cursor-pointer hover:text-white" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button 
                          onClick={() => toggleItem(item.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold ${item.completed ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#22c55e] text-black hover:bg-[#4ade80]'}`}
                        >
                          {item.completed ? '+ New' : '▶ Start'}
                        </button>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {item.completed ? (
                          <button className="flex items-center gap-1 px-3 py-1 bg-[#06b6d4] text-black rounded-md text-xs font-semibold hover:bg-[#22d3ee]">
                            <History size={12} /> History (2)
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
