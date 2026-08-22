import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, CheckSquare, Square, Trophy, RotateCcw, PauseCircle, Sparkles } from 'lucide-react';

export default function DsaTracker({ items, setItems }) {
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleItem = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const sections = Array.from(new Set(items.map(i => i.section)));
  
  const totalCompleted = items.filter(i => i.completed).length;
  const overallPct = Math.round((totalCompleted / items.length) * 100) || 0;

  return (
    <div className="bg-[#121212] min-h-screen text-gray-300 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Progress Bar */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-6 flex-1">
            <span className="text-sm font-medium text-gray-400">Progress</span>
            <div className="relative w-48 h-1.5 bg-gray-800 rounded-full flex items-center">
              <div className="absolute h-1.5 bg-[#d97736] rounded-full" style={{ width: `${overallPct}%` }}></div>
              <div className="absolute w-3 h-3 bg-[#d97736] rounded-full shadow" style={{ left: `calc(${overallPct}% - 6px)` }}></div>
            </div>
            <div className="flex items-center gap-2 text-[#d97736] text-sm font-bold ml-4">
              <Trophy size={16} /> Day {totalCompleted}/40
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <button className="flex items-center gap-1 hover:text-gray-300"><RotateCcw size={14}/> Reset</button>
            <button className="flex items-center gap-1 hover:text-gray-300"><PauseCircle size={14}/> Pause</button>
          </div>
        </div>

        {/* Banner */}
        <div className="bg-[#241710] border border-[#3d2516] rounded-xl p-4 mb-8 flex items-center gap-4">
          <div className="bg-[#d97736]/20 p-2 rounded-lg">
            <Sparkles size={20} className="text-[#d97736]" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Goodbye Roadmaps. <span className="text-[#d97736]">Hello Planly.</span></h2>
            <p className="text-gray-400 text-sm">Roadmaps will retire this September, making way for Planly, a better way to learn.</p>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-3">
          {sections.map(section => {
            const sectionItems = items.filter(i => i.section === section);
            const sectionCompleted = sectionItems.filter(i => i.completed).length;
            const isFullyCompleted = sectionCompleted === sectionItems.length;
            const isCollapsed = collapsedSections[section];
            const sectionPct = Math.round((sectionCompleted / sectionItems.length) * 100);

            return (
              <div key={section} className="border border-gray-800 rounded-xl bg-[#1a1a1a] overflow-hidden transition-all">
                {/* Header */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#222222]"
                  onClick={() => setCollapsedSections(prev => ({...prev, [section]: !isCollapsed}))}
                >
                  <div className="flex items-center gap-3">
                    <div className={isFullyCompleted ? 'text-gray-500' : 'text-[#d97736]'}>
                      {isFullyCompleted ? <CheckSquare size={18} className="fill-[#333] text-black" /> : <Square size={18} />}
                    </div>
                    <span className={`font-semibold ${isFullyCompleted ? 'text-white/70' : 'text-white'}`}>
                      {section} <span className="text-gray-500 font-normal ml-1">({sectionCompleted}/{sectionItems.length})</span>
                    </span>
                    
                    {!isCollapsed && sectionPct > 0 && sectionPct < 100 && (
                      <div className="ml-4 flex items-center gap-2">
                        <div className="w-24 h-1 bg-gray-800 rounded-full">
                          <div className="h-1 bg-gray-500 rounded-full" style={{ width: `${sectionPct}%` }}></div>
                        </div>
                        <span className="text-[10px] text-gray-500">{sectionPct}%</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <button className="p-1 hover:bg-gray-800 rounded-full"><Minus size={16} /></button>
                    <span>01 Aug - 01 Aug</span>
                    <button className="p-1 hover:bg-gray-800 rounded-full"><Plus size={16} /></button>
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </div>
                </div>

                {/* Body */}
                {!isCollapsed && (
                  <div className="px-12 py-3 border-t border-gray-800/50 space-y-3 bg-[#171717]">
                    {sectionItems.map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-3 group cursor-pointer"
                        onClick={() => toggleItem(item.id)}
                      >
                        <div className="text-gray-600 group-hover:text-gray-400">
                          {item.completed ? <CheckSquare size={16} className="fill-[#444] text-[#111]" /> : <Square size={16} />}
                        </div>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`text-sm font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-gray-300 group-hover:text-white'}`}
                          onClick={(e) => e.stopPropagation()} // Prevent double toggle
                        >
                          {item.title}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
