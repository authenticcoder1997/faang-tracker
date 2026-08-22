import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CircleMinus, CirclePlus, Trophy, RotateCcw, PauseCircle, Sparkles } from 'lucide-react';

export default function DsaTracker({ items, setItems }) {
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleItem = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const sections = Array.from(new Set(items.map(i => i.section)));
  
  const totalCompleted = items.filter(i => i.completed).length;
  const overallPct = items.length > 0 ? Math.round((totalCompleted / items.length) * 100) : 0;

  const completedDays = sections.filter(sec => {
    const sItems = items.filter(i => i.section === sec);
    return sItems.length > 0 && sItems.every(i => i.completed);
  }).length;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-gray-300 p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Progress Bar */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-4 sm:gap-6 flex-1">
            <span className="hidden sm:inline text-sm font-medium text-gray-400">Progress</span>
            <div className="relative w-32 sm:w-48 h-1.5 bg-gray-800 rounded-full flex items-center">
              <div className="absolute h-1.5 bg-green-500 rounded-full transition-all duration-300" style={{ width: `${overallPct}%` }}></div>
              <div className="absolute w-3 h-3 bg-green-500 rounded-full shadow transition-all duration-300" style={{ left: `calc(${overallPct}% - 6px)` }}></div>
            </div>
            <div className="flex items-center gap-2 text-green-500 text-sm font-bold sm:ml-4">
              <Trophy size={16} /> Day {completedDays}/{sections.length}
              <span className="text-gray-400 font-normal text-xs ml-1">({totalCompleted}/{items.length} problems)</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-gray-500 text-sm">
            <button className="flex items-center gap-1 hover:text-gray-300"><RotateCcw size={14}/> Reset</button>
            <button className="flex items-center gap-1 hover:text-gray-300"><PauseCircle size={14}/> Pause</button>
          </div>
        </div>

        {/* Banner */}
        <div className="bg-[#112a1c] border border-[#1e4a31] rounded-xl p-4 mb-8 flex items-center gap-4">
          <div className="bg-green-500/20 p-2 rounded-lg">
            <Sparkles size={20} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Goodbye Roadmaps. <span className="text-green-500">Hello Planly.</span></h2>
            <p className="text-gray-400 text-xs sm:text-sm">Roadmaps will retire this September, making way for Planly, a better way to learn.</p>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-2 sm:space-y-4">
          {sections.map((section, idx) => {
            const sectionItems = items.filter(i => i.section === section);
            const sectionCompleted = sectionItems.filter(i => i.completed).length;
            const isFullyCompleted = sectionCompleted === sectionItems.length && sectionItems.length > 0;
            const isCollapsed = collapsedSections[section] !== undefined ? collapsedSections[section] : true; // Default collapsed
            const sectionPct = sectionItems.length > 0 ? Math.round((sectionCompleted / sectionItems.length) * 100) : 0;
            
            // Real sequential date logic starting July 31st (matches Planly schedule)
            const startDate = new Date(2024, 6, 31); // 31 July
            const targetDate = new Date(startDate);
            targetDate.setDate(startDate.getDate() + idx);
            const day = String(targetDate.getDate()).padStart(2, '0');
            const month = targetDate.toLocaleString('en-US', { month: 'short' });
            const dateStr = `${day} ${month} - ${day} ${month}`;

            return (
              <div key={section} className="w-full flex bg-[#111111] flex-col rounded-xl border border-gray-800 transition-all">
                {/* Header */}
                <div className="rounded-xl border border-transparent">
                  <button 
                    className={`flex p-3 sm:p-[12px] px-3 sm:px-4 items-center justify-between w-full group text-gray-200 rounded-t-xl hover:bg-gray-800/50 ${!isCollapsed ? 'bg-gray-800/30' : ''}`}
                    aria-expanded={!isCollapsed}
                    onClick={() => setCollapsedSections(prev => ({...prev, [section]: !isCollapsed}))}
                  >
                    <div className="flex items-center justify-center gap-2 sm:gap-3 min-w-0">
                      <input 
                        readOnly 
                        disabled 
                        className={`border-gray-500 border-[1.3px] h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 rounded-full ${isFullyCompleted ? 'bg-green-500 border-green-500' : 'bg-transparent'}`} 
                        type="checkbox" 
                        checked={isFullyCompleted} 
                      />
                      <div className="flex text-left gap-1.5 text-sm sm:text-base font-bold min-w-0">
                        <div className="font-medium truncate">{section}</div>
                        <p className="font-medium whitespace-nowrap text-gray-500">({sectionCompleted}/{sectionItems.length})</p>
                      </div>
                      
                      {!isCollapsed && sectionPct >= 0 && (
                        <div className="relative hidden md:flex items-center gap-2 min-w-48 px-2 ml-4">
                          <div className="relative flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 ease-out bg-green-500" style={{ width: `${sectionPct}%` }}></div>
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">{sectionPct}%</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2 ml-2 shrink-0 text-gray-500">
                      <div className="p-1 hover:text-gray-300 transition-colors"><CircleMinus size={18} strokeWidth={1.5} /></div>
                      <div className="hidden sm:flex items-center"><p className="text-xs sm:text-sm">{dateStr}</p></div>
                      <div className="p-1 hover:text-gray-300 transition-colors"><CirclePlus size={18} strokeWidth={1.5} /></div>
                      <div className={`ml-1 sm:ml-4 transition-transform duration-200 ${!isCollapsed ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} strokeWidth={2} />
                      </div>
                    </div>
                  </button>
                </div>

                {/* Body */}
                {!isCollapsed && (
                  <div className="text-sm text-gray-200 overflow-hidden border-t border-gray-800">
                    <div className="flex flex-col py-2 bg-[#151515] rounded-b-xl">
                      {sectionItems.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-center w-full gap-x-3 px-4 sm:px-6 py-2 hover:bg-gray-800/60 transition-colors group cursor-pointer"
                          onClick={() => toggleItem(item.id)}
                        >
                          <input 
                            readOnly 
                            className={`border border-gray-500 h-4 w-4 rounded-full transition-colors ${item.completed ? 'bg-green-500 border-green-500' : 'bg-transparent'}`} 
                            type="checkbox" 
                            checked={item.completed}
                          />
                          <a 
                            href={item.url || '#'} 
                            target={item.url ? "_blank" : "_self"} 
                            rel="noopener noreferrer"
                            className={`text-[15px] sm:text-[17px] font-medium transition-colors ${item.completed ? 'text-gray-500 line-through' : 'text-gray-400 group-hover:text-gray-200'}`}
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            {item.title}
                          </a>
                        </div>
                      ))}
                    </div>
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
